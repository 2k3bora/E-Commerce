const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// POST /api/admin/distributors
// Body: { email, name }
// Only admin users may create distributors
router.post('/distributors', auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role.toString().toLowerCase() !== 'admin') return res.status(403).json({ message: 'Forbidden, admin only' });

    const { email, name, password } = req.body;
    if (!email) return res.status(400).json({ message: 'email required' });

    const User = require('../models/User');
    const Wallet = require('../models/Wallet');

    const normalized = email.toLowerCase();
    let target = await User.findOne({ email: normalized });
    const bcrypt = require('bcryptjs');
    if (!target) {
      const doc = {
        username: (name || normalized.split('@')[0]).toString().replace(/\s+/g, '').toLowerCase(),
        email: normalized,
        name: name || normalized.split('@')[0],
        role: 'distributor',
        parent: user._id,
        status: 'active'
      };
      if (password) {
        const salt = await bcrypt.genSalt(10);
        doc.password = await bcrypt.hash(password, salt);
        doc.authProvider = 'local';
      } else {
        doc.authProvider = 'dev';
      }
      target = new User(doc);
      await target.save();
    } else {
      // update role and parent if needed
      target.role = 'distributor';
      target.parent = user._id;
      if (!target.status || target.status === 'pending') target.status = 'active';
      // ensure username exists
      if (!target.username) target.username = (name || normalized.split('@')[0]).toString().replace(/\s+/g, '').toLowerCase();
      // if admin supplied a password, set/overwrite it
      if (password) {
        const salt = await bcrypt.genSalt(10);
        target.password = await bcrypt.hash(password, salt);
        target.authProvider = 'local';
      }
      await target.save();
    }

    // ensure wallet exists
    let wallet = await Wallet.findOne({ user: target._id });
    if (!wallet) {
      wallet = new Wallet({ user: target._id, balance: 0 });
      await wallet.save();
    }

    return res.json({ message: 'Distributor created/updated', user: { id: target._id, email: target.email, name: target.name, role: target.role } });
  } catch (err) {
    console.error('Create distributor error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
});

// GET /api/admin/distributors - list distributors (admin only)
router.get('/distributors', auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role.toString().toLowerCase() !== 'admin') return res.status(403).json({ message: 'Forbidden, admin only' });
    const User = require('../models/User');
    const list = await User.find({ role: { $in: ['distributor', 'Distributor'] } }).select('-password').lean();
    return res.json(list);
  } catch (err) {
    console.error('List distributors error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
});

// POST /api/admin/branches - create a branch manager under a distributor (admin only)
// Body: { email, name, password, distributorId }
router.post('/branches', auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role.toString().toLowerCase() !== 'admin') return res.status(403).json({ message: 'Forbidden, admin only' });

    const { email, name, password, distributorId } = req.body;
    if (!email) return res.status(400).json({ message: 'email required' });
    // distributorId is now optional. If not provided, parent is null (or could be admin, but null implies direct company branch)

    const User = require('../models/User');
    const Wallet = require('../models/Wallet');
    const normalized = email.toLowerCase();
    let target = await User.findOne({ email: normalized });
    const bcrypt = require('bcryptjs');
    if (!target) {
      const doc = {
        username: (name || normalized.split('@')[0]).toString().replace(/\s+/g, '').toLowerCase(),
        email: normalized,
        name: name || normalized.split('@')[0],
        role: 'branch',
        parent: distributorId || null,
        status: 'active'
      };
      if (password) {
        const salt = await bcrypt.genSalt(10);
        doc.password = await bcrypt.hash(password, salt);
        doc.authProvider = 'local';
      } else {
        doc.authProvider = 'dev';
      }
      target = new User(doc);
      await target.save();
    } else {
      target.role = 'branch';
      target.parent = distributorId || null;
      if (!target.username) target.username = (name || normalized.split('@')[0]).toString().replace(/\s+/g, '').toLowerCase();
      if (password) {
        const salt = await bcrypt.genSalt(10);
        target.password = await bcrypt.hash(password, salt);
        target.authProvider = 'local';
      }
      if (!target.status || target.status === 'pending') target.status = 'active';
      await target.save();
    }

    // ensure wallet exists
    let wallet = await Wallet.findOne({ user: target._id });
    if (!wallet) {
      wallet = new Wallet({ user: target._id, balance: 0 });
      await wallet.save();
    }

    return res.json({ message: 'Branch created/updated', user: { id: target._id, email: target.email, name: target.name, role: target.role } });
  } catch (err) {
    console.error('Create branch error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
});

// GET /api/admin/branches - list branches (admin only)
router.get('/branches', auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role.toString().toLowerCase() !== 'admin') return res.status(403).json({ message: 'Forbidden, admin only' });
    const User = require('../models/User');
    // Populate parent to show which distributor they belong to
    const list = await User.find({ role: 'branch' }).select('-password').populate('parent', 'name email').lean();
    return res.json(list);
  } catch (err) {
    console.error('List branches error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
});

// POST /api/admin/commission-config
// Body: { companyShare, distributorShare, branchShare, customerPointRate }
router.post('/commission-config', auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role.toString().toLowerCase() !== 'admin') return res.status(403).json({ message: 'Forbidden, admin only' });

    const CommissionConfig = require('../models/CommissionConfig');
    const { companyShare, distributorShare, branchShare, customerPointRate, tiers } = req.body;

    const config = new CommissionConfig({
      companyShare,
      distributorShare,
      branchShare,
      customerPointRate,
      tiers: tiers || [],
      active: true,
      effectiveFrom: Date.now()
    });
    await config.save();
    return res.json(config);
  } catch (err) {
    console.error('Create commission config error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
});

// GET /api/admin/user-profile/:userId - Get any user's profile (admin only)
router.get('/user-profile/:userId', auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role.toString().toLowerCase() !== 'admin') return res.status(403).json({ message: 'Forbidden, admin only' });

    const User = require('../models/User');
    const userProfile = await User.findById(req.params.userId).select('-password').lean();
    if (!userProfile) return res.status(404).json({ message: 'User not found' });

    return res.json(userProfile);
  } catch (err) {
    console.error('Fetch user profile error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
});

module.exports = router;

