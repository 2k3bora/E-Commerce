const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Wallet = require('../models/Wallet');
const WithdrawalRequest = require('../models/WithdrawalRequest');

// POST /api/distributor/branches - authenticated distributor creates a branch under them
router.post('/branches', auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role.toString().toLowerCase() !== 'distributor') return res.status(403).json({ message: 'Forbidden, distributor only' });

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
        role: 'branch',
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
      target.role = 'branch';
      target.parent = user._id;
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
    console.error('Create branch (distributor) error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
});

// POST /api/distributor/product-config
// Body: { productId, baseRate }
router.post('/product-config', auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role.toString().toLowerCase() !== 'distributor') return res.status(403).json({ message: 'Forbidden, distributor only' });

    const { productId, baseRate } = req.body;
    if (!productId || !baseRate) return res.status(400).json({ message: 'productId and baseRate required' });

    const DistributorProductConfig = require('../models/DistributorProductConfig');

    // Upsert config
    const config = await DistributorProductConfig.findOneAndUpdate(
      { distributor: user._id, product: productId },
      { baseRate, effectiveFrom: Date.now() },
      { new: true, upsert: true }
    );

    return res.json(config);
  } catch (err) {
    console.error('Create product config error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
});

// GET /api/distributor/stats
// Get comprehensive dashboard statistics for distributor
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role?.toString().toLowerCase();

    if (role !== 'distributor') {
      return res.status(403).json({ message: 'Forbidden, distributor only' });
    }

    // 1. Get all orders for this distributor
    const orders = await Order.find({ distributor: userId })
      .sort({ createdAt: -1 })
      .populate('product', 'name sku')
      .populate('customer', 'name email')
      .lean();

    // 2. Calculate total sales (sum of all finalPricePaid)
    const totalSales = orders.reduce((acc, order) => acc + (order.finalPricePaid || 0), 0);

    // 3. Calculate total commission earned by distributor
    const totalCommissionEarned = orders.reduce((acc, order) => acc + (order.distributorCommission || 0), 0);

    // 4. Get wallet balance (pending amount)
    let wallet = await Wallet.findOne({ user: userId });
    const pendingAmount = wallet ? wallet.balance : 0;

    // 5. Get total received amount (approved withdrawals)
    const approvedWithdrawals = await WithdrawalRequest.find({
      user: userId,
      status: 'approved'
    }).lean();
    const receivedAmount = approvedWithdrawals.reduce((acc, req) => acc + (req.amount || 0), 0);

    res.json({
      orders,
      totalSales,
      totalCommissionEarned,
      pendingAmount,
      receivedAmount,
      orderCount: orders.length
    });
  } catch (err) {
    console.error('Stats error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
