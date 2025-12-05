const mongoose = require('mongoose');
const { Schema } = mongoose;

const walletSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    },
    loyaltyPoints: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: 'INR'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

walletSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
