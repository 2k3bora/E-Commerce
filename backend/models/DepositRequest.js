const mongoose = require('mongoose');
const { Schema } = mongoose;

const DepositRequestSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    transactionId: { type: String, required: true },
    proofImage: { type: String }, // Base64 image
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User' }, // Branch who requested it (optional)
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' }, // Admin who processed it
    processedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('DepositRequest', DepositRequestSchema);
