const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const DepositRequest = require('../models/DepositRequest');
const mongoose = require('mongoose');

// GET /api/wallet
// Get current user's wallet balance and recent transactions
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch Wallet
        let wallet = await Wallet.findOne({ user: userId });
        if (!wallet) {
            // Should have been created on registration, but handle just in case
            wallet = new Wallet({ user: userId, balance: 0 });
            await wallet.save();
        }

        // Fetch recent transactions (limit 50)
        const transactions = await Transaction.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            balance: wallet.balance,
            currency: wallet.currency,
            loyaltyPoints: wallet.loyaltyPoints,
            transactions
        });
    } catch (err) {
        console.error('Wallet fetch error', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/wallet/withdraw
// Create a withdrawal request
router.post('/withdraw', authMiddleware, async (req, res) => {
    try {
        const { amount, bankDetails } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });
        if (!bankDetails) return res.status(400).json({ message: 'Bank details required' });

        const wallet = await Wallet.findOne({ user: req.user._id });
        if (!wallet || wallet.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });

        const request = new WithdrawalRequest({
            user: req.user._id,
            amount,
            bankDetails
        });
        await request.save();
        res.json({ message: 'Withdrawal request created', request });
    } catch (err) {
        console.error('Withdrawal request error', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/wallet/withdrawals
// List withdrawal requests
router.get('/withdrawals', authMiddleware, async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'admin') {
            query.user = req.user._id;
        }
        const requests = await WithdrawalRequest.find(query).sort({ createdAt: -1 }).populate('user', 'name email');
        res.json(requests);
    } catch (err) {
        console.error('List withdrawals error', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/wallet/withdraw/:id/approve (Admin only)
router.post('/withdraw/:id/approve', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    try {
        const request = await WithdrawalRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

        const wallet = await Wallet.findOne({ user: request.user });
        if (!wallet || wallet.balance < request.amount) return res.status(400).json({ message: 'Insufficient user balance' });

        wallet.balance -= request.amount;
        await wallet.save();

        request.status = 'approved';
        request.processedAt = new Date();
        await request.save();

        const tx = new Transaction({
            wallet: wallet._id,
            user: request.user,
            amount: request.amount,
            type: 'debit',
            category: 'refund',
            description: 'Withdrawal approved',
            referenceId: request._id.toString(),
            balanceBefore: wallet.balance + request.amount,
            balanceAfter: wallet.balance
        });
        await tx.save();

        res.json({ message: 'Approved' });
    } catch (err) {
        console.error('Approve withdrawal error', err);
        res.status(500).json({ message: err.message });
    }
});

// POST /api/wallet/withdraw/:id/reject (Admin only)
router.post('/withdraw/:id/reject', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        const request = await WithdrawalRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

        request.status = 'rejected';
        request.processedAt = new Date();
        await request.save();
        res.json({ message: 'Rejected' });
    } catch (err) {
        console.error('Reject withdrawal error', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/wallet/deposit
// Create a deposit request (e.g. from Branch onboarding a customer)
router.post('/deposit', authMiddleware, async (req, res) => {
    try {
        const { amount, transactionId, proofImage, userId } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });
        if (!transactionId) return res.status(400).json({ message: 'Transaction ID required' });

        // If branch is requesting for a customer, userId is passed. Otherwise, it's for self.
        const targetUserId = userId || req.user._id;

        const request = new DepositRequest({
            user: targetUserId,
            amount,
            transactionId,
            proofImage,
            requestedBy: req.user._id
        });
        await request.save();
        res.json({ message: 'Deposit request created', request });
    } catch (err) {
        console.error('Deposit request error', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// GET /api/wallet/deposits/pending (Admin only)
router.get('/deposits/pending', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        const requests = await DepositRequest.find({ status: 'pending' })
            .sort({ createdAt: -1 })
            .populate('user', 'name email')
            .populate('requestedBy', 'name email');
        res.json(requests);
    } catch (err) {
        console.error('List pending deposits error', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/wallet/deposits/:id/approve (Admin only)
router.post('/deposits/:id/approve', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    try {
        const request = await DepositRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

        let wallet = await Wallet.findOne({ user: request.user });
        if (!wallet) {
            // Create if missing
            wallet = new Wallet({ user: request.user, balance: 0 });
            await wallet.save();
        }

        wallet.balance += request.amount;
        await wallet.save();

        request.status = 'approved';
        request.processedBy = req.user._id;
        request.processedAt = new Date();
        await request.save();

        const tx = new Transaction({
            wallet: wallet._id,
            user: request.user,
            amount: request.amount,
            type: 'credit',
            category: 'deposit',
            description: 'Deposit approved',
            referenceId: request._id.toString(),
            balanceBefore: wallet.balance - request.amount,
            balanceAfter: wallet.balance,
            meta: { transactionId: request.transactionId }
        });
        await tx.save();

        res.json({ message: 'Approved' });
    } catch (err) {
        console.error('Approve deposit error', err);
        res.status(500).json({ message: err.message });
    }
});

// POST /api/wallet/deposits/:id/reject (Admin only)
router.post('/deposits/:id/reject', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        const request = await DepositRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

        request.status = 'rejected';
        request.processedBy = req.user._id;
        request.processedAt = new Date();
        await request.save();
        res.json({ message: 'Rejected' });
    } catch (err) {
        console.error('Reject deposit error', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
