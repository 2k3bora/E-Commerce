import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, CardActions, Button, Chip, Badge, Fab } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import CartContext from '../context/CartContext';
import StarRating from '../components/StarRating';
import { useNavigate } from 'react-router-dom';

export default function ProductCatalogPage() {
    const { user } = useContext(AuthContext);
    const { addToCart, cartCount } = useContext(CartContext);
    const [products, setProducts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const res = await axios.get('/api/products');
                const allProducts = res.data || [];
                const branchId = user.parent || 'company'; // Use 'company' for direct sales if no parent

                const productsWithPrice = await Promise.all(allProducts.map(async (p) => {
                    if (!p.active) return null;
                    try {
                        const priceRes = await axios.get(`/api/products/price?productId=${p._id}&branchId=${branchId}`);
                        return { ...p, ...priceRes.data };
                    } catch (err) {
                        console.error('Price fetch failed for', p.name, err);
                        return { ...p, priceError: true };
                    }
                }));
                setProducts(productsWithPrice.filter(Boolean));
            } catch (err) {
                console.error('Load products failed', err);
            }
        };
        loadProducts();
    }, [user]);

    const handleBuy = async (product) => {
        if (!product.finalPrice) return alert('Price not available');
        try {
            const res = await axios.post('/api/order/create', {
                productId: product._id,
                branchId: user.parent
            });
            if (res.data.ok) {
                alert(`Purchase successful! Order ID: ${res.data.orderId}. Points earned: ${res.data.loyaltyPointsEarned}`);
            }
        } catch (err) {
            console.error('Purchase failed', err);
            alert('Purchase failed: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Product Catalog</Typography>
                <Fab color="primary" variant="extended" onClick={() => navigate('/checkout')}>
                    <Badge badgeContent={cartCount} color="secondary" sx={{ mr: 1 }}>
                        <ShoppingCartIcon />
                    </Badge>
                    Checkout
                </Fab>
            </Box>
            <Grid container spacing={3}>
                {products.map(p => (
                    <Grid item xs={12} sm={6} md={4} key={p._id}>
                        <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}>
                            {p.images && p.images.length > 0 && (
                                <CardMedia
                                    component="img"
                                    height="140"
                                    image={p.images[0]}
                                    alt={p.name}
                                    onClick={() => navigate(`/product/${p._id}`)}
                                />
                            )}
                            <CardContent onClick={() => navigate(`/product/${p._id}`)}>
                                <Typography variant="h6">{p.name}</Typography>
                                <Typography variant="body2" color="text.secondary">{p.description}</Typography>
                                <Box sx={{ mt: 1 }}>
                                    <StarRating value={p.averageRating || 0} size="small" reviewCount={p.reviewCount} />
                                </Box>
                                <Box sx={{ mt: 2 }}>
                                    {p.finalPrice ? (
                                        <>
                                            <Typography variant="h6" color="primary">₹{p.finalPrice.toFixed(2)}</Typography>
                                            <Typography variant="caption" color="text.secondary">Retail Price (Inclusive of all charges)</Typography>
                                        </>
                                    ) : (
                                        <Typography variant="body2" color="error">Price Unavailable</Typography>
                                    )}
                                </Box>
                            </CardContent>
                            <CardActions>
                                <Button size="small" variant="contained" onClick={() => handleBuy(p)} disabled={!p.finalPrice}>
                                    Buy Now
                                </Button>
                                <Button size="small" variant="outlined" onClick={() => addToCart({ productId: p._id, name: p.name, finalPrice: p.finalPrice })} disabled={!p.finalPrice}>
                                    Add to Cart
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
