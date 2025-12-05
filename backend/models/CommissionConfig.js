const mongoose = require('mongoose');
const { Schema } = mongoose;

const CommissionConfigSchema = new Schema({
  companyShare: { type: Number, required: true, default: 0.05 },
  distributorShare: { type: Number, required: true, default: 0.03 },
  branchShare: { type: Number, required: true, default: 0.02 },
  customerPointRate: { type: Number, required: true, default: 0.01 },
  // Tiers for dynamic commission: [{ minCustomers: 10, minSales: 10000, bonusRate: 0.01 }]
  tiers: [{
    minCustomers: { type: Number, default: 0 },
    minSales: { type: Number, default: 0 },
    bonusRate: { type: Number, required: true }
  }],
  active: { type: Boolean, default: true },
  effectiveFrom: { type: Date, default: Date.now },
  note: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CommissionConfig', CommissionConfigSchema);
