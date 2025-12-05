const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// GET /api/user/profile - Get current user's profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password').lean();
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error('Get profile error', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/user/profile - Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, withdrawalDetails } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Update allowed fields
        if (name !== undefined) user.name = name;
        if (withdrawalDetails !== undefined) {
            user.withdrawalDetails = {
                upiId: withdrawalDetails.upiId || '',
                bankAccountNumber: withdrawalDetails.bankAccountNumber || '',
                bankIFSC: withdrawalDetails.bankIFSC || '',
                bankAccountName: withdrawalDetails.bankAccountName || ''
            };
        }

        await user.save();

        const updatedUser = await User.findById(user._id).select('-password').lean();
        res.json(updatedUser);
    } catch (err) {
        console.error('Update profile error', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
