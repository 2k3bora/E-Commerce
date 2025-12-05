const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProductSchema = new Schema({
  name: { type: String, required: true, index: true },
  description: { type: String },
  images: [{ type: String }], // Array of Base64 image strings
  sku: { type: String, index: true, sparse: true },
  basePrice: { type: Number },
  stock: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  active: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  // New marketplace fields
  category: { type: String, index: true },
  tags: [{ type: String }],
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  attributes: { type: Schema.Types.Mixed } // Product specifications like {Brand: 'Samsung', Model: 'Galaxy S21'}
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
