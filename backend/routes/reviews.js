const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

// POST /api/reviews - Create a review (requires auth and verified purchase)
router.post('/', auth, async (req, res) => {
    try {
        const { productId, rating, title, comment, orderId, images } = req.body;
        const userId = req.user._id;

        if (!productId || !rating) {
            return res.status(400).json({ message: 'Product ID and rating are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({ product: productId, user: userId });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }

        // Check for verified purchase if orderId is provided
        let verifiedPurchase = false;
        if (orderId) {
            const order = await Order.findOne({
                _id: orderId,
                product: productId,
                customer: userId,
                status: { $in: ['delivered', 'fulfilled'] }
            });
            verifiedPurchase = !!order;
        }

        // Create review
        const review = new Review({
            product: productId,
            user: userId,
            order: orderId || null,
            rating,
            title: title || '',
            comment: comment || '',
            verifiedPurchase,
            images: images || []
        });

        await review.save();

        // Update product's average rating and review count
        const reviews = await Review.find({ product: productId, status: 'approved' });
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

        await Product.findByIdAndUpdate(productId, {
            averageRating: avgRating,
            reviewCount: reviews.length
        });

        res.status(201).json(review);
    } catch (err) {
        console.error('Create review error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/reviews/:productId - Get reviews for a product
router.get('/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sort = req.query.sort || '-createdAt'; // -createdAt (newest), rating, -helpfulCount

        const reviews = await Review.find({ product: productId, status: 'approved' })
            .populate('user', 'name profilePicture')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const total = await Review.countDocuments({ product: productId, status: 'approved' });

        res.json({
            reviews,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Get reviews error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/reviews/:id - Update own review
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, title, comment, images } = req.body;
        const userId = req.user._id;

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check ownership
        if (review.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this review' });
        }

        // Update fields
        if (rating !== undefined) {
            if (rating < 1 || rating > 5) {
                return res.status(400).json({ message: 'Rating must be between 1 and 5' });
            }
            review.rating = rating;
        }
        if (title !== undefined) review.title = title;
        if (comment !== undefined) review.comment = comment;
        if (images !== undefined) review.images = images;

        await review.save();

        // Recalculate product rating
        const reviews = await Review.find({ product: review.product, status: 'approved' });
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

        await Product.findByIdAndUpdate(review.product, {
            averageRating: avgRating
        });

        res.json(review);
    } catch (err) {
        console.error('Update review error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/reviews/:id - Delete own review
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check ownership or admin
        if (review.user.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this review' });
        }

        const productId = review.product;
        await Review.findByIdAndDelete(id);

        // Recalculate product rating
        const reviews = await Review.find({ product: productId, status: 'approved' });
        const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

        await Product.findByIdAndUpdate(productId, {
            averageRating: avgRating,
            reviewCount: reviews.length
        });

        res.json({ message: 'Review deleted successfully' });
    } catch (err) {
        console.error('Delete review error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/reviews/:id/helpful - Mark review as helpful
router.post('/:id/helpful', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Toggle helpful vote
        const index = review.helpfulVotes.indexOf(userId);
        if (index > -1) {
            // Remove vote
            review.helpfulVotes.splice(index, 1);
            review.helpfulCount = Math.max(0, review.helpfulCount - 1);
        } else {
            // Add vote
            review.helpfulVotes.push(userId);
            review.helpfulCount = review.helpfulVotes.length;
        }

        await review.save();
        res.json({ helpfulCount: review.helpfulCount, voted: index === -1 });
    } catch (err) {
        console.error('Mark helpful error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
