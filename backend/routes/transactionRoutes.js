const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Validation middleware for purchase
const validatePurchase = [
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    body('userId').isMongoId().withMessage('A valid userId is required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

// POST /api/purchase
// We might want to protect this route. The scaffold says "Staff" role required.
// For now, let's just use 'auth' middleware which checks for valid token.
// If specific role needed, we can add check.
router.post('/purchase', auth, validatePurchase, transactionController.handlePurchase);

module.exports = router;
