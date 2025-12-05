const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
const CommissionConfig = require('../models/CommissionConfig');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

// Calculate final price based on CUSTOMER's hierarchy (not product creator)
async function calculateFinalPrice(productId, customerId, session = null) {
  const product = await Product.findById(productId).session(session);
  if (!product) throw new Error('Product not found');

  const commission = await CommissionConfig.findOne({ active: true }).sort({ effectiveFrom: -1 }).session(session);
  if (!commission) throw new Error('No active commission config');

  const baseRate = product.basePrice;
  if (!baseRate) throw new Error('Product has no base price');

  // Get customer and their hierarchy
  const customer = await User.findById(customerId).session(session);
  if (!customer) throw new Error('Customer not found');

  let distributorId = null;
  let branchId = null;
  let directSale = false;

  //Get customer's branch
  if (customer.parent) {
    const branch = await User.findById(customer.parent).session(session);
    if (branch && branch.role === 'branch') {
      branchId = branch._id;

      // Get branch's parent (distributor)
      if (branch.parent) {
        const distributor = await User.findById(branch.parent).session(session);
        if (distributor && distributor.role === 'distributor') {
          distributorId = distributor._id;
        }
      }
    }
  }

  // If no branch/distributor hierarchy, it's a direct company sale
  if (!branchId && !distributorId) {
    directSale = true;
  }

  const companyCommission = +(baseRate * (commission.companyShare || 0));
  const distributorCommission = distributorId ? +(baseRate * (commission.distributorShare || 0)) : 0;
  const branchCommission = branchId ? +(baseRate * (commission.branchShare || 0)) : 0;
  const finalPrice = +(baseRate + companyCommission + distributorCommission + branchCommission);

  return {
    baseRate,
    companyCommission,
    distributorCommission,
    branchCommission,
    finalPrice,
    distributorId,
    branchId,
    directSale,
    commissionConfigId: commission._id
  };
}

// POST /api/order/create
router.post('/create', auth, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const customerId = req.user._id;
    const { productId } = req.body;

    console.log('[Order] Creating order for customer:', customerId, 'product:', productId);

    if (!customerId || !productId) return res.status(400).json({ message: 'productId required' });

    session.startTransaction();

    // Calculate price based on customer's hierarchy
    const priceResult = await calculateFinalPrice(productId, customerId, session);
    const finalPrice = priceResult.finalPrice;

    console.log('[Order] Price calculated:', finalPrice, 'breakdown:', priceResult);

    // Find wallet and ensure sufficient balance
    let wallet = await Wallet.findOne({ user: customerId }).session(session);

    // Create wallet if it doesn't exist
    if (!wallet) {
      console.log('[Order] Wallet not found, creating new wallet for user:', customerId);
      wallet = new Wallet({ user: customerId, balance: 0, transactions: [] });
      await wallet.save({ session });
    }

    console.log('[Order] Wallet balance:', wallet.balance, 'Required:', finalPrice);

    if (wallet.balance < finalPrice) {
      throw new Error(`Insufficient wallet balance. You have ₹${wallet.balance.toFixed(2)}, but need ₹${finalPrice.toFixed(2)}`);
    }

    const balanceBefore = wallet.balance;
    wallet.balance = wallet.balance - finalPrice;
    await wallet.save({ session });

    // Create order
    const order = new Order({
      customer: customerId,
      product: productId,
      distributor: priceResult.distributorId,
      branch: priceResult.branchId,
      baseRate: priceResult.baseRate,
      companyCommission: priceResult.companyCommission,
      distributorCommission: priceResult.distributorCommission,
      branchCommission: priceResult.branchCommission,
      finalPricePaid: finalPrice,
      status: 'paid',
      paymentMeta: { method: 'wallet' }
    });
    await order.save({ session });

    // Create transaction
    const tx = new Transaction({
      wallet: wallet._id,
      user: customerId,
      amount: finalPrice,
      type: 'debit',
      description: 'Purchase debit',
      referenceId: order._id.toString(),
      balanceBefore,
      balanceAfter: wallet.balance,
      meta: { orderId: order._id }
    });
    await tx.save({ session });

    // Distribute commissions to respective wallets
    const adminUser = await User.findOne({ role: 'admin' }).session(session);
    if (adminUser && priceResult.companyCommission > 0) {
      const adminWallet = await Wallet.findOne({ user: adminUser._id }).session(session);
      if (adminWallet) {
        adminWallet.balance += priceResult.companyCommission;
        await adminWallet.save({ session });
      }
    }

    if (priceResult.distributorId && priceResult.distributorCommission > 0) {
      const distWallet = await Wallet.findOne({ user: priceResult.distributorId }).session(session);
      if (distWallet) {
        distWallet.balance += priceResult.distributorCommission;
        await distWallet.save({ session });
      }
    }

    if (priceResult.branchId && priceResult.branchCommission > 0) {
      const branchWallet = await Wallet.findOne({ user: priceResult.branchId }).session(session);
      if (branchWallet) {
        branchWallet.balance += priceResult.branchCommission;
        await branchWallet.save({ session });
      }
    }

    // Loyalty points
    const commissionConfig = await CommissionConfig.findOne({ active: true }).session(session);
    let points = 0;
    if (commissionConfig && commissionConfig.customerPointRate) {
      points = Math.floor(finalPrice * commissionConfig.customerPointRate);
      await User.updateOne({ _id: customerId }, { $inc: { 'metadata.loyaltyPoints': points } }).session(session);
      order.loyaltyPointsEarned = points;
      await order.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return res.json({ ok: true, orderId: order._id, finalPrice, loyaltyPointsEarned: points });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Order creation failed:', err);
    if (err.message === 'Insufficient wallet balance') return res.status(402).json({ ok: false, message: err.message });
    return res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/order/list - Get orders with pagination and filters
router.get('/list', auth, async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status; // Optional status filter

    let query = {};

    if (role === 'admin') {
      // see all
    } else if (role === 'distributor') {
      query.distributor = userId;
    } else if (role === 'branch') {
      query.branch = userId;
    } else if (role === 'customer') {
      query.customer = userId;
    } else {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('product', 'name images')
      .populate('customer', 'name email')
      .populate('distributor', 'name')
      .populate('branch', 'name')
      .lean();

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('List orders error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/order/:id - Get single order detail
router.get('/:id', auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user._id;
    const role = req.user.role;

    const order = await Order.findById(orderId)
      .populate('product', 'name description images basePrice')
      .populate('customer', 'name email')
      .populate('distributor', 'name')
      .populate('branch', 'name')
      .lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    if (role === 'customer' && order.customer._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    } else if (role === 'distributor' && (!order.distributor || order.distributor._id.toString() !== userId.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    } else if (role === 'branch' && (!order.branch || order.branch._id.toString() !== userId.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }
    // Admin can view all

    res.json(order);
  } catch (err) {
    console.error('Get order detail error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/order/:id/status - Update order status (seller/admin only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, trackingNumber, estimatedDelivery } = req.body;
    const userId = req.user._id;
    const role = req.user.role;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization (only seller, distributor, or admin can update)
    if (role !== 'admin' && (!order.distributor || order.distributor.toString() !== userId.toString())) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    // Validate status transition
    const validStatuses = ['paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    if (status) order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);
    if (status === 'delivered') order.deliveredAt = new Date();

    await order.save();
    res.json(order);
  } catch (err) {
    console.error('Update order status error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/order/:id/cancel - Cancel order (customer only, within time limit)
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { reason } = req.body;
    const userId = req.user._id;
    const role = req.user.role;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if customer owns this order
    if (role === 'customer' && order.customer.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    // Can only cancel if status is 'paid' or 'processing'
    if (!['paid', 'processing'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled in current status' });
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Refund to wallet
      const wallet = await Wallet.findOne({ user: order.customer }).session(session);
      if (wallet) {
        const balanceBefore = wallet.balance;
        wallet.balance += order.finalPricePaid;
        await wallet.save({ session });

        // Create refund transaction
        const tx = new Transaction({
          wallet: wallet._id,
          user: order.customer,
          amount: order.finalPricePaid,
          type: 'credit',
          description: 'Order cancellation refund',
          referenceId: order._id.toString(),
          balanceBefore,
          balanceAfter: wallet.balance,
          meta: { orderId: order._id, reason }
        });
        await tx.save({ session });
      }

      // Update order status
      order.status = 'cancelled';
      order.cancelReason = reason || 'Customer cancellation';
      order.cancelledAt = new Date();
      await order.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.json({ message: 'Order cancelled and refunded successfully', order });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (err) {
    console.error('Cancel order error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
