const mongoose = require('mongoose');
const { Schema } = mongoose;

const transactionSchema = new Schema({
    wallet: {
        type: Schema.Types.ObjectId,
        ref: 'Wallet',
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['debit', 'credit'],
        required: true
    },
    category: {
        type: String,
        enum: ['deposit', 'purchase', 'commission', 'refund'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    referenceId: {
        type: String
    },
    balanceBefore: {
        type: Number
    },
    balanceAfter: {
        type: Number
    },
    meta: {
        type: Schema.Types.Mixed
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
