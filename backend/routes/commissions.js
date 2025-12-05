const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const CommissionConfig = require('../models/CommissionConfig');

// GET /api/commissions - List all commission configs (admin only)
router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const configs = await CommissionConfig.find().sort({ createdAt: -1 });
        res.json(configs);
    } catch (err) {
        console.error('List commissions error', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/commissions/active - Get active commission config
router.get('/active', async (req, res) => {
    try {
        const config = await CommissionConfig.findOne({ active: true }).sort({ effectiveFrom: -1 });
        if (!config) {
            return res.status(404).json({ message: 'No active commission config found' });
        }
        res.json(config);
    } catch (err) {
        console.error('Get active commission error', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/commissions - Create new commission config (admin only)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { companyShare, distributorShare, branchShare, customerPointRate, tiers, active, note } = req.body;

        // If setting as active, deactivate all others
        if (active) {
            await CommissionConfig.updateMany({}, { active: false });
        }

        const config = new CommissionConfig({
            companyShare,
            distributorShare,
            branchShare,
            customerPointRate,
            tiers: tiers || [],
            active: active !== false,
            note
        });

        await config.save();
        res.status(201).json(config);
    } catch (err) {
        console.error('Create commission error', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/commissions/:id - Update commission config (admin only)
router.put('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { companyShare, distributorShare, branchShare, customerPointRate, tiers, active, note } = req.body;

        // If setting as active, deactivate all others
        if (active) {
            await CommissionConfig.updateMany({ _id: { $ne: req.params.id } }, { active: false });
        }

        const config = await CommissionConfig.findByIdAndUpdate(
            req.params.id,
            { companyShare, distributorShare, branchShare, customerPointRate, tiers, active, note },
            { new: true }
        );

        if (!config) {
            return res.status(404).json({ message: 'Commission config not found' });
        }

        res.json(config);
    } catch (err) {
        console.error('Update commission error', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/commissions/:id - Delete commission config (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const config = await CommissionConfig.findById(req.params.id);
        if (!config) {
            return res.status(404).json({ message: 'Commission config not found' });
        }

        if (config.active) {
            return res.status(400).json({ message: 'Cannot delete active commission config' });
        }

        await CommissionConfig.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error('Delete commission error', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
