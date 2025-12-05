import React, { useState, useEffect, useContext } from 'react';
import {
    Box, Typography, Button, Grid, Paper, Divider, TableContainer,
    Table, TableBody, TableRow, TableCell, TextField, IconButton, Alert
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import CartContext from '../context/CartContext';
import ProductImageCarousel from '../components/ProductImageCarousel';
import StarRating from '../components/StarRating';

export default function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { addToCart } = useContext(CartContext);

    const [product, setProduct] = useState(null);
    const [priceData, setPriceData] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [inWishlist, setInWishlist] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadProductData();
        loadReviews();
        loadRelatedProducts();
        checkWishlist();
    }, [id]);

    const loadProductData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/products/${id}`);
            setProduct(res.data);

            // Get pricing
            const branchId = user?.parent || 'company';
            const priceRes = await axios.get(`/api/products/price?productId=${id}&branchId=${branchId}`);
            setPriceData(priceRes.data);
        } catch (err) {
            console.error('Load product error:', err);
            setError('Failed to load product');
        } finally {
            setLoading(false);
        }
    };

    const loadReviews = async () => {
        try {
            const res = await axios.get(`/api/reviews/${id}?limit=5`);
            setReviews(res.data.reviews || []);
        } catch (err) {
            console.error('Load reviews error:', err);
        }
    };

    const loadRelatedProducts = async () => {
        try {
            const res = await axios.get(`/api/products/${id}/related`);
            setRelatedProducts(res.data || []);
        } catch (err) {
            console.error('Load related products error:', err);
        }
    };

    const checkWishlist = async () => {
        if (!user) return;
        try {
            const res = await axios.get('/api/wishlist');
            const items = res.data || [];
            setInWishlist(items.some(item => item.product?._id === id));
        } catch (err) {
            console.error('Check wishlist error:', err);
        }
    };

    const toggleWishlist = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            if (inWishlist) {
                await axios.delete(`/api/wishlist/${id}`);
                setInWishlist(false);
            } else {
                await axios.post('/api/wishlist', { productId: id });
                setInWishlist(true);
            }
        } catch (err) {
            console.error('Toggle wishlist error:', err);
            alert('Failed to update wishlist');
        }
    };

    const handleAddToCart = () => {
        if (!priceData) return;
        addToCart({
            productId: product._id,
            name: product.name,
            finalPrice: priceData.finalPrice,
            quantity
        });
        alert(`Added ${quantity} item(s) to cart`);
    };

    const handleBuyNow = async () => {
        if (!priceData) return;
        try {
            const res = await axios.post('/api/order/create', {
                productId: product._id,
                branchId: user?.parent
            });
            if (res.data.ok) {
                navigate(`/order/${res.data.orderId}`);
            }
        } catch (err) {
            console.error('Buy now error:', err);
            alert('Purchase failed: ' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) {
        return <Box sx={{ p: 3 }}><Typography>Loading...</Typography></Box>;
    }

    if (error || !product) {
        return <Box sx={{ p: 3 }}><Alert severity="error">{error || 'Product not found'}</Alert></Box>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Grid container spacing={4}>
                {/* Image Section */}
                <Grid item xs={12} md={6}>
                    <ProductImageCarousel images={product.images} productName={product.name} />
                </Grid>

                {/* Product Info Section */}
                <Grid item xs={12} md={6}>
                    <Typography variant="h4" gutterBottom>{product.name}</Typography>

                    {/* Rating */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <StarRating value={product.averageRating || 0} showValue reviewCount={product.reviewCount} />
                    </Box>

                    {/* Price */}
                    {priceData && (
                        <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
                            ₹{priceData.finalPrice?.toFixed(2)}
                        </Typography>
                    )}

                    {/* Category */}
                    {product.category && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Category: {product.category}
                        </Typography>
                    )}

                    {/* Stock Status */}
                    <Typography variant="body2" color={product.stock > 0 ? 'success.main' : 'error'} sx={{ mb: 2 }}>
                        {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                    </Typography>

                    {/* Description */}
                    <Typography variant="body1" paragraph>{product.description}</Typography>

                    <Divider sx={{ my: 2 }} />

                    {/* Quantity Selector */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography>Quantity:</Typography>
                        <TextField
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                            inputProps={{ min: 1, max: product.stock }}
                            sx={{ width: 80 }}
                            size="small"
                        />
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            startIcon={<ShoppingCartIcon />}
                            onClick={handleAddToCart}
                            disabled={product.stock === 0 || !priceData}
                        >
                            Add to Cart
                        </Button>
                        <Button
                            variant="outlined"
                            color="primary"
                            size="large"
                            onClick={handleBuyNow}
                            disabled={product.stock === 0 || !priceData}
                        >
                            Buy Now
                        </Button>
                        <IconButton onClick={toggleWishlist} color={inWishlist ? 'error' : 'default'}>
                            {inWishlist ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                        </IconButton>
                    </Box>

                    {/* Seller Info */}
                    {product.createdBy && (
                        <Paper sx={{ p: 2, mt: 2, bgcolor: '#f5f5f5' }}>
                            <Typography variant="subtitle2">Sold by</Typography>
                            <Typography variant="body2">{product.createdBy.name || product.createdBy.email}</Typography>
                        </Paper>
                    )}
                </Grid>
            </Grid>

            {/* Product Specifications */}
            {product.attributes && Object.keys(product.attributes).length > 0 && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>Specifications</Typography>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableBody>
                                {Object.entries(product.attributes).map(([key, value]) => (
                                    <TableRow key={key}>
                                        <TableCell sx={{ fontWeight: 500, width: '30%' }}>{key}</TableCell>
                                        <TableCell>{String(value)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* Reviews Section */}
            <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>Customer Reviews</Typography>
                {reviews.length > 0 ? (
                    reviews.map((review) => (
                        <Paper key={review._id} sx={{ p: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <StarRating value={review.rating} size="small" />
                                <Typography variant="subtitle2" sx={{ ml: 2 }}>
                                    {review.user?.name || 'Anonymous'}
                                </Typography>
                                {review.verifiedPurchase && (
                                    <Typography variant="caption" color="success.main" sx={{ ml: 1 }}>
                                        ✓ Verified Purchase
                                    </Typography>
                                )}
                            </Box>
                            {review.title && <Typography variant="subtitle1">{review.title}</Typography>}
                            <Typography variant="body2">{review.comment}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {new Date(review.createdAt).toLocaleDateString()}
                            </Typography>
                        </Paper>
                    ))
                ) : (
                    <Typography variant="body2" color="text.secondary">No reviews yet</Typography>
                )}
            </Box>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>Related Products</Typography>
                    <Grid container spacing={2}>
                        {relatedProducts.map((p) => (
                            <Grid item xs={12} sm={6} md={4} lg={2} key={p._id}>
                                <Paper
                                    sx={{ p: 2, cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                                    onClick={() => navigate(`/product/${p._id}`)}
                                >
                                    {p.images && p.images[0] && (
                                        <Box component="img" src={p.images[0]} alt={p.name} sx={{ width: '100%', height: 120, objectFit: 'contain' }} />
                                    )}
                                    <Typography variant="body2" sx={{ mt: 1 }}>{p.name}</Typography>
                                    <Typography variant="subtitle2" color="primary">₹{p.basePrice?.toFixed(2)}</Typography>
                                    <StarRating value={p.averageRating || 0} size="small" />
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}
        </Box>
    );
}
