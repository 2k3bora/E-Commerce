const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// POST /api/payment/verify
// This endpoint is intended to be called by the payment gateway webhook
router.post('/verify', express.json(), paymentController.verifyPayment);

module.exports = router;
