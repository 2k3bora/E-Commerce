const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

// GET /api/customers - list customers (admin/distributor)
router.get('/', auth, async (req, res) => {
  try {
    const role = (req.user.role || '').toString().toLowerCase();
    if (!['admin', 'distributor', 'branch'].includes(role)) return res.status(403).json({ message: 'Forbidden' });

    let query = { role: { $in: ['customer', 'Customer'] } };
    if (role === 'branch') {
      query.parent = req.user._id;
    }
    // Distributors might want to see all customers under their branches? 
    // For now, let's keep it simple: distributors see all (or we could filter by their branches).
    // Admin sees all.

    const customers = await User.find(query).select('-password').lean();
    // attach wallet balances
    const ids = customers.map(c => c._id);
    const wallets = await Wallet.find({ user: { $in: ids } }).lean();
    const walletMap = {};
    wallets.forEach(w => walletMap[w.user.toString()] = w.balance);
    const result = customers.map(c => ({ ...c, balance: walletMap[c._id.toString()] || 0 }));
    return res.json(result);
  } catch (err) {
    console.error('List customers error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
});

// PATCH /api/customers/:id/status - update status (admin/distributor)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const role = (req.user.role || '').toString().toLowerCase();
    if (!['admin', 'distributor'].includes(role)) return res.status(403).json({ message: 'Forbidden' });
    const { id } = req.params;
    const { status } = req.body;
    if (!['active', 'pending', 'suspended', 'inactive'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.status = status;
    await user.save();
    return res.json({ message: 'Status updated', user: { id: user._id, status: user.status } });
  } catch (err) {
    console.error('Update customer status error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
});

module.exports = router;
