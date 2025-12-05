const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Wallet = require('../models/Wallet');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const authMiddleware = require('../middleware/auth');

// POST /api/auth/google
// Authenticate user with Google and return a JWT + user object
router.post('/google', async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { name, email, picture } = ticket.getPayload();

    // Map email patterns to roles automatically for convenience
    function mapEmailToRole(email) {
      if (!email) return 'customer';
      const lower = email.toLowerCase();
      if (lower.startsWith('admin@') || lower.endsWith('@admin.example.com')) return 'admin';
      if (lower.startsWith('distributor@') || lower.endsWith('@distributor.example.com')) return 'distributor';
      if (lower.startsWith('branch@') || lower.endsWith('@branch.example.com')) return 'branch';
      return 'customer';
    }

    let user = await User.findOne({ email });
    const inferredRole = mapEmailToRole(email);

    if (!user) {
      user = new User({
        name,
        email,
        username: email, // Required field
        profilePicture: picture,
        authProvider: 'google',
        status: 'active',
        role: inferredRole
      });
      await user.save();
    } else {
      // if user exists but has default role, allow auto-updating to inferred (do not override explicit admin set)
      if (!user.role || user.role === 'customer') {
        user.role = inferredRole;
        await user.save();
      }
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' },
      (err, tokenStr) => {
        if (err) throw err;
        res.json({ token: tokenStr, user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status } });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// POST /api/auth/dev-login
// Development/testing helper to login as a user with a specific role (only enable in non-production)
router.post('/dev-login', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).send('Not allowed');

  const { email, name, role } = req.body;
  if (!email || !role) return res.status(400).send('email and role are required');

  try {
    // Normalize role to lowercase where appropriate
    const normalizedRole = role.toString().toLowerCase();

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        email,
        username: email, // Required field
        name: name || email.split('@')[0],
        role: normalizedRole,
        authProvider: 'dev',
        status: 'active'
      });
      await user.save();
    } else {
      // ensure role matches requested for testing convenience
      user.role = normalizedRole;
      user.status = 'active';
      await user.save();
    }

    const payload = { user: { id: user._id, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' }, (err, tokenStr) => {
      if (err) throw err;
      res.json({ token: tokenStr, user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status } });
    });
  } catch (err) {
    console.error('Dev login error', err);
    res.status(500).send('Server error: ' + err.message);
  }
});

// POST /api/auth/register
// Create a new user with email & password. Customer accounts are created with status 'pending' (require onboarding).
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });
    const normalized = email.toLowerCase();
    let existing = await User.findOne({ email: normalized });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = new User({
      email: normalized,
      username: normalized, // Required field
      name: name || normalized.split('@')[0],
      password: hashed,
      role: 'customer',
      status: 'pending',
      authProvider: 'local'
    });
    await user.save();

    // create wallet
    const wallet = new Wallet({ user: user._id, balance: 0 });
    await wallet.save();

    return res.status(201).json({ message: 'Registered', user: { id: user._id, email: user.email, status: user.status } });
  } catch (err) {
    console.error('Register error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
});

// POST /api/auth/login
// Login with email/password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('[DEBUG] Login attempt for:', email);

    if (!email || !password) return res.status(400).json({ message: 'email and password required' });
    const normalized = email.toLowerCase();

    const user = await User.findOne({ email: normalized });
    console.log('[DEBUG] User found:', user ? 'Yes' : 'No');

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (!user.password) return res.status(400).json({ message: 'User has no password; try Google login' });

    const match = await bcrypt.compare(password, user.password);
    console.log('[DEBUG] Password match:', match);

    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const payload = { user: { id: user._id, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' }, (err, tokenStr) => {
      if (err) throw err;
      // include mustChangePassword flag so frontend can force password update on first login
      res.json({ token: tokenStr, user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status, mustChangePassword: !!user.mustChangePassword } });
    });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
});

// POST /api/auth/change-password
// Body: { oldPassword, newPassword }
// Requires authentication
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ message: 'newPassword is required' });

    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // If user has a password, require oldPassword to match. If user was created with no password (unlikely here), allow setting directly.
    if (user.password) {
      if (!oldPassword) return res.status(400).json({ message: 'oldPassword is required' });
      const match = await bcrypt.compare(oldPassword, user.password);
      if (!match) return res.status(400).json({ message: 'old password incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = false;
    await user.save();

    return res.json({ message: 'Password changed' });
  } catch (err) {
    console.error('Change password error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
});

// POST /api/auth/forgot-password
// Body: { email }
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate token
    const crypto = require('crypto');
    const token = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // In a real app, send email here.
    // For simulation, log the token to console so developer/user can see it.
    console.log(`[SIMULATION] Password Reset Token for ${email}: ${token}`);
    console.log(`[SIMULATION] Reset Link: http://localhost:3000/reset-password/${token}`);

    return res.json({ message: 'If that email exists, a reset link has been sent (check server console)' });
  } catch (err) {
    console.error('Forgot password error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
});

// POST /api/auth/reset-password
// Body: { token, newPassword }
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'Token and new password required' });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Password reset token is invalid or has expired' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    // If they were forced to change password, this counts as changing it
    user.mustChangePassword = false;

    await user.save();

    return res.json({ message: 'Password has been reset' });
  } catch (err) {
    console.error('Reset password error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
});

// POST /api/auth/register-customer (Branch only)
router.post('/register-customer', authMiddleware, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });

    // Ensure requester is a branch (or admin/distributor if needed, but requirement says Branch)
    if (req.user.role !== 'branch' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const normalized = email.toLowerCase();
    let existing = await User.findOne({ email: normalized });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = new User({
      email: normalized,
      username: normalized, // Required field
      name: name || normalized.split('@')[0],
      password: hashed,
      role: 'customer',
      status: 'active', // Active immediately as branch verified them
      authProvider: 'local',
      parent: req.user._id // Linked to this branch
    });
    await user.save();

    // create wallet
    const wallet = new Wallet({ user: user._id, balance: 0 });
    await wallet.save();

    return res.status(201).json({ message: 'Customer registered', user: { id: user._id, email: user.email } });
  } catch (err) {
    console.error('Register customer error', err);
    return res.status(500).json({ message: 'Internal error: ' + err.message });
  }
});

module.exports = router;
