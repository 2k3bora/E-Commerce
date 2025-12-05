const mongoose = require('mongoose');
const { Schema } = mongoose;

const DistributorProductConfigSchema = new Schema({
  distributor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  // baseRate stored in paise (integer) is recommended. For backwards compatibility keep Number but prefer pae.
  baseRate: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  effectiveFrom: { type: Date, default: Date.now },
  effectiveTo: { type: Date }
}, { timestamps: true });

DistributorProductConfigSchema.index({ distributor: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('DistributorProductConfig', DistributorProductConfigSchema);
