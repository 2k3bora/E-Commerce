const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// GET /api/wishlist - Get user's wishlist
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user._id;

        let wishlist = await Wishlist.findOne({ user: userId })
            .populate({
                path: 'products.product',
                select: 'name description images basePrice category averageRating reviewCount active stock'
            })
            .lean();

        if (!wishlist) {
            wishlist = { user: userId, products: [] };
        }

        // Filter out inactive products or products that no longer exist
        const activeProducts = wishlist.products.filter(item =>
            item.product && item.product.active
        );

        res.json(activeProducts);
    } catch (err) {
        console.error('Get wishlist error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/wishlist - Add product to wishlist
router.post('/', auth, async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user._id;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Find or create wishlist
        let wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            wishlist = new Wishlist({
                user: userId,
                products: [{ product: productId }]
            });
        } else {
            // Check if product already in wishlist
            const exists = wishlist.products.some(item =>
                item.product.toString() === productId.toString()
            );

            if (exists) {
                return res.status(400).json({ message: 'Product already in wishlist' });
            }

            wishlist.products.push({ product: productId });
        }

        await wishlist.save();

        // Populate and return
        wishlist = await Wishlist.findOne({ user: userId })
            .populate({
                path: 'products.product',
                select: 'name description images basePrice category averageRating reviewCount active stock'
            });

        res.status(201).json(wishlist);
    } catch (err) {
        console.error('Add to wishlist error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/wishlist/:productId - Remove product from wishlist
router.delete('/:productId', auth, async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;

        const wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found' });
        }

        // Remove product from wishlist
        wishlist.products = wishlist.products.filter(item =>
            item.product.toString() !== productId.toString()
        );

        await wishlist.save();
        res.json({ message: 'Product removed from wishlist' });
    } catch (err) {
        console.error('Remove from wishlist error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/wishlist - Clear entire wishlist
router.delete('/', auth, async (req, res) => {
    try {
        const userId = req.user._id;

        await Wishlist.findOneAndUpdate(
            { user: userId },
            { products: [] }
        );

        res.json({ message: 'Wishlist cleared' });
    } catch (err) {
        console.error('Clear wishlist error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
