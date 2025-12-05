import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, TextField, Paper, Alert, Grid, Card, CardContent } from '@mui/material';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

export default function DistributorDashboard() {
    const { user } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [rates, setRates] = useState({});
    const [stats, setStats] = useState({
        orders: [],
        totalSales: 0,
        totalCommissionEarned: 0,
        pendingAmount: 0,
        receivedAmount: 0,
        orderCount: 0
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                // Load products for rate management
                const res = await axios.get('/api/products');
                // Filter products created by this user (createdBy is now populated with user object)
                const myProducts = res.data.filter(p => p.createdBy?._id === user._id || p.createdBy === user._id);
                setProducts(myProducts || []);

                // Load financial stats
                const statsRes = await axios.get('/api/distributor/stats');
                setStats(statsRes.data);
            } catch (err) {
                console.error('Load data failed', err);
            }
        };
        loadData();
    }, [user._id]);

    const handleRateChange = (id, value) => {
        setRates({ ...rates, [id]: value });
    };

    const saveRate = async (productId) => {
        const rate = rates[productId];
        if (!rate) return alert('Please enter a base rate');
        try {
            await axios.post('/api/distributor/product-config', {
                productId,
                baseRate: parseFloat(rate)
            });
            alert('Rate saved successfully!');
        } catch (err) {
            console.error('Save rate failed', err);
            alert(err.response?.data?.message || 'Failed to save rate');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Distributor Dashboard</Typography>
                <Button variant="contained" color="secondary" onClick={() => window.location.href = '/admin/products'}>
                    Manage Products
                </Button>
            </Box>

            {/* Financial Overview Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>Financial Overview</Typography>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
                            <CardContent>
                                <Typography variant="h6">Total Sales</Typography>
                                <Typography variant="h4">₹{stats.totalSales?.toFixed(2) || '0.00'}</Typography>
                                <Typography variant="body2">{stats.orderCount} orders</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
                            <CardContent>
                                <Typography variant="h6">Commission Earned</Typography>
                                <Typography variant="h4">₹{stats.totalCommissionEarned?.toFixed(2) || '0.00'}</Typography>
                                <Typography variant="body2">From all orders</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
                            <CardContent>
                                <Typography variant="h6">Pending Amount</Typography>
                                <Typography variant="h4">₹{stats.pendingAmount?.toFixed(2) || '0.00'}</Typography>
                                <Typography variant="body2">In wallet</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ bgcolor: 'info.light', color: 'white' }}>
                            <CardContent>
                                <Typography variant="h6">Received Amount</Typography>
                                <Typography variant="h4">₹{stats.receivedAmount?.toFixed(2) || '0.00'}</Typography>
                                <Typography variant="body2">Approved withdrawals</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Paper>

            {/* Orders Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Recent Orders</Typography>
                {stats.orders.length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                        No orders yet.
                    </Typography>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Product</TableCell>
                                <TableCell>Customer</TableCell>
                                <TableCell>Sale Amount</TableCell>
                                <TableCell>Your Commission</TableCell>
                                <TableCell>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stats.orders.map(order => (
                                <TableRow key={order._id}>
                                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>{order.product?.name || 'N/A'}</TableCell>
                                    <TableCell>{order.customer?.name || order.customer?.email || 'N/A'}</TableCell>
                                    <TableCell>₹{order.finalPricePaid?.toFixed(2)}</TableCell>
                                    <TableCell>₹{order.distributorCommission?.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: order.status === 'paid' ? 'success.main' : 'text.secondary',
                                                textTransform: 'capitalize'
                                            }}
                                        >
                                            {order.status}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Paper>

            {/* Product Rate Management Section */}
            <Alert severity="info" sx={{ mb: 3 }}>
                You can only set base rates for products you created. Products created by others will not appear here.
            </Alert>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Manage Product Base Rates (Your Products Only)</Typography>
                {products.length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                        No products found. Create products first to set their base rates.
                    </Typography>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Product Name</TableCell>
                                <TableCell>SKU</TableCell>
                                <TableCell>Creator</TableCell>
                                <TableCell>Current Base Price</TableCell>
                                <TableCell>Set Base Rate (₹)</TableCell>
                                <TableCell>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.map(p => (
                                <TableRow key={p._id}>
                                    <TableCell>{p.name}</TableCell>
                                    <TableCell>{p.sku}</TableCell>
                                    <TableCell>{p.createdBy?.name || p.createdBy?.username || p.createdBy?.email || 'Unknown'}</TableCell>
                                    <TableCell>₹{p.basePrice || 'Not Set'}</TableCell>
                                    <TableCell>
                                        <TextField
                                            type="number"
                                            size="small"
                                            value={rates[p._id] || ''}
                                            onChange={(e) => handleRateChange(p._id, e.target.value)}
                                            placeholder="Enter Base Rate"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="contained" size="small" onClick={() => saveRate(p._id)}>
                                            Save
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Paper>
        </Box>
    );
}
