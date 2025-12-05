const mongoose = require('mongoose');
const { Schema } = mongoose;

const WishlistSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    products: [{
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        addedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

// Ensure one wishlist per user
WishlistSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', WishlistSchema);
