import React, { useState, useEffect, useContext } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, CardMedia, CardActions,
    Button, IconButton, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import CartContext from '../context/CartContext';
import StarRating from '../components/StarRating';

export default function WishlistPage() {
    const { user } = useContext(AuthContext);
    const { addToCart } = useContext(CartContext);
    const navigate = useNavigate();
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadWishlist();
    }, []);

    const loadWishlist = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/wishlist');
            setWishlistItems(res.data || []);
        } catch (err) {
            console.error('Load wishlist error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (productId) => {
        try {
            await axios.delete(`/api/wishlist/${productId}`);
            setWishlistItems(prev => prev.filter(item => item.product._id !== productId));
        } catch (err) {
            console.error('Remove from wishlist error:', err);
            alert('Failed to remove item');
        }
    };

    const handleAddToCart = (item) => {
        if (!item.product) return;
        addToCart({
            productId: item.product._id,
            name: item.product.name,
            finalPrice: item.product.basePrice,
            quantity: 1
        });
        alert('Added to cart!');
    };

    if (loading) {
        return <Box sx={{ p: 3 }}><Typography>Loading...</Typography></Box>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>My Wishlist</Typography>

            {wishlistItems.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Your wishlist is empty. Start adding products you love!
                    <Button variant="text" onClick={() => navigate('/catalog')} sx={{ ml: 2 }}>
                        Browse Products
                    </Button>
                </Alert>
            ) : (
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    {wishlistItems.map((item) => {
                        const product = item.product;
                        if (!product) return null;

                        return (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    {product.images && product.images[0] && (
                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={product.images[0]}
                                            alt={product.name}
                                            sx={{ objectFit: 'contain', bgcolor: '#f5f5f5', cursor: 'pointer' }}
                                            onClick={() => navigate(`/product/${product._id}`)}
                                        />
                                    )}
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography
                                            variant="h6"
                                            sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                                            onClick={() => navigate(`/product/${product._id}`)}
                                        >
                                            {product.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            {product.description?.substring(0, 100)}
                                            {product.description?.length > 100 && '...'}
                                        </Typography>
                                        <Box sx={{ mt: 1 }}>
                                            <StarRating value={product.averageRating || 0} size="small" reviewCount={product.reviewCount} />
                                        </Box>
                                        <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                                            ₹{product.basePrice?.toFixed(2)}
                                        </Typography>
                                        {product.stock > 0 ? (
                                            <Typography variant="caption" color="success.main">
                                                In Stock
                                            </Typography>
                                        ) : (
                                            <Typography variant="caption" color="error">
                                                Out of Stock
                                            </Typography>
                                        )}
                                    </CardContent>
                                    <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            startIcon={<ShoppingCartIcon />}
                                            onClick={() => handleAddToCart(item)}
                                            disabled={product.stock === 0}
                                        >
                                            Add to Cart
                                        </Button>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleRemove(product._id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </CardActions>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </Box>
    );
}
