const mongoose = require('mongoose');
const { Schema } = mongoose;

const WithdrawalRequestSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    bankDetails: { type: String, required: true }, // Simple string for now, could be object
    adminNote: { type: String },
    processedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('WithdrawalRequest', WithdrawalRequestSchema);
