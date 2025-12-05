const mongoose = require('mongoose');
const { Schema } = mongoose;

const commissionLedgerSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    transaction: {
        type: Schema.Types.ObjectId,
        ref: 'Transaction',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    commissionPercentage: {
        type: Number,
        required: true
    },
    earnedAt: {
        type: Date,
        default: Date.now
    }
});

const CommissionLedger = mongoose.model('CommissionLedger', commissionLedgerSchema);

module.exports = CommissionLedger;
