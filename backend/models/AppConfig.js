const mongoose = require('mongoose');
const { Schema } = mongoose;

const AppConfigSchema = new Schema({
  siteName: { type: String, default: 'E-commerce Platform' },
  siteIconUrl: { type: String },
  defaultAdminEmail: { type: String },
  adminUpiId: { type: String },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('AppConfig', AppConfigSchema);
