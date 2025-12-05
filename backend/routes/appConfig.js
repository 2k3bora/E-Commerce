const express = require('express');
const router = express.Router();
const AppConfig = require('../models/AppConfig');
const auth = require('../middleware/auth');

// GET /api/app/config - public
router.get('/config', async (req, res) => {
  try {
    const cfg = await AppConfig.findOne().sort({ createdAt: -1 }).lean();
    if (!cfg) return res.json({ siteName: 'E-commerce Platform', siteIconUrl: '', defaultAdminEmail: '' });
    return res.json(cfg);
  } catch (err) {
    console.error('Get app config error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
});

// PUT /api/app/config - admin only
router.put('/config', auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role.toString().toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'Forbidden, admin only' });
    }

    const { siteName, siteIconUrl, defaultAdminEmail, adminUpiId } = req.body;
    // upsert: create new config document
    const cfg = new AppConfig({ siteName, siteIconUrl, defaultAdminEmail, adminUpiId, updatedBy: user._id });
    await cfg.save();
    return res.json(cfg);
  } catch (err) {
    console.error('Update app config error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
});

// POST /api/app/create-admin - admin can create/update an admin user (useful to set default admin id/email)
router.post('/create-admin', auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role.toString().toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'Forbidden, admin only' });
    }

    const { email, name } = req.body;
    if (!email) return res.status(400).json({ message: 'email required' });

    const User = require('../models/User');
    const normalized = email.toLowerCase();
    let target = await User.findOne({ email: normalized });
    if (!target) {
      target = new User({ email: normalized, name: name || normalized.split('@')[0], role: 'admin', status: 'active', authProvider: 'dev' });
      await target.save();
    } else {
      target.role = 'admin';
      target.status = 'active';
      await target.save();
    }

    return res.json({ message: 'Admin created/updated', userId: target._id, email: target.email });
  } catch (err) {
    console.error('Create admin error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
});

module.exports = router;
