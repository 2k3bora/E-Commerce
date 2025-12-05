const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrderSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  distributor: { type: Schema.Types.ObjectId, ref: 'User' },
  branch: { type: Schema.Types.ObjectId, ref: 'User' },
  baseRate: { type: Number, required: true },
  companyCommission: { type: Number, default: 0 },
  distributorCommission: { type: Number, default: 0 },
  branchCommission: { type: Number, default: 0 },
  finalPricePaid: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['created', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'fulfilled'],
    default: 'paid',
    index: true
  },
  loyaltyPointsEarned: { type: Number, default: 0 },
  paymentMeta: { type: Schema.Types.Mixed },
  // New shipping and tracking fields
  trackingNumber: { type: String },
  shippingAddress: { type: Schema.Types.Mixed },
  estimatedDelivery: { type: Date },
  cancelReason: { type: String },
  cancelledAt: { type: Date },
  deliveredAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
