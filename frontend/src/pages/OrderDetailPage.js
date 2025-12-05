import React, { useState, useEffect, useContext } from 'react';
import {
    Box, Typography, Paper, Grid, Button, Stepper, Step, StepLabel,
    Divider, TableContainer, Table, TableBody, TableRow, TableCell, Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import OrderStatusBadge from '../components/OrderStatusBadge';

export default function OrderDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    useEffect(() => {
        loadOrder();
    }, [id]);

    const loadOrder = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/order/${id}`);
            setOrder(res.data);
        } catch (err) {
            console.error('Load order error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        try {
            await axios.post(`/api/order/${id}/cancel`, { reason: cancelReason });
            setCancelDialogOpen(false);
            loadOrder();
            alert('Order cancelled successfully');
        } catch (err) {
            console.error('Cancel order error:', err);
            alert('Failed to cancel order: ' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) {
        return <Box sx={{ p: 3 }}><Typography>Loading...</Typography></Box>;
    }

    if (!order) {
        return <Box sx={{ p: 3 }}><Typography>Order not found</Typography></Box>;
    }

    const canCancel = ['paid', 'processing'].includes(order.status) && user?.role === 'customer';

    const statusSteps = ['Paid', 'Processing', 'Shipped', 'Delivered'];
    const activeStep = statusSteps.findIndex(s => s.toLowerCase() === order.status);

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Order Details</Typography>
                <Button variant="outlined" onClick={() => navigate('/orders')}>
                    Back to Orders
                </Button>
            </Box>

            {/* Order Status Stepper */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Order Status</Typography>
                    <OrderStatusBadge status={order.status} />
                </Box>
                {!['cancelled', 'refunded'].includes(order.status) && (
                    <Stepper activeStep={activeStep} alternativeLabel sx={{ mt: 2 }}>
                        {statusSteps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                )}
                {order.cancelReason && (
                    <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                        Cancellation Reason: {order.cancelReason}
                    </Typography>
                )}
            </Paper>

            <Grid container spacing={3}>
                {/* Product Details */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Product Information</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            {order.product?.images?.[0] && (
                                <Box
                                    component="img"
                                    src={order.product.images[0]}
                                    alt={order.product.name}
                                    sx={{ width: 120, height: 120, objectFit: 'contain', bgcolor: '#f5f5f5', borderRadius: 1 }}
                                />
                            )}
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h6">{order.product?.name}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    {order.product?.description}
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>

                    {/* Shipping Info */}
                    {order.trackingNumber && (
                        <Paper sx={{ p: 3, mt: 3 }}>
                            <Typography variant="h6" gutterBottom>Shipping Information</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <TableContainer>
                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 500 }}>Tracking Number</TableCell>
                                            <TableCell>{order.trackingNumber}</TableCell>
                                        </TableRow>
                                        {order.estimatedDelivery && (
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 500 }}>Estimated Delivery</TableCell>
                                                <TableCell>{new Date(order.estimatedDelivery).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        )}
                                        {order.deliveredAt && (
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 500 }}>Delivered On</TableCell>
                                                <TableCell>{new Date(order.deliveredAt).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    )}
                </Grid>

                {/* Order Summary */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Order Summary</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <TableContainer>
                            <Table>
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 500 }}>Order ID</TableCell>
                                        <TableCell>{order._id.slice(-8)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 500 }}>Order Date</TableCell>
                                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 500 }}>Base Price</TableCell>
                                        <TableCell>₹{order.baseRate?.toFixed(2)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 500 }}>Total Amount</TableCell>
                                        <TableCell>
                                            <Typography variant="h6" color="primary">
                                                ₹{order.finalPricePaid?.toFixed(2)}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                    {order.loyaltyPointsEarned > 0 && (
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 500 }}>Loyalty Points</TableCell>
                                            <TableCell>{order.loyaltyPointsEarned}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {canCancel && (
                            <Button
                                variant="outlined"
                                color="error"
                                fullWidth
                                sx={{ mt: 2 }}
                                onClick={() => setCancelDialogOpen(true)}
                            >
                                Cancel Order
                            </Button>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Cancel Order Dialog */}
            <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
                <DialogTitle>Cancel Order</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Are you sure you want to cancel this order? The amount will be refunded to your wallet.
                    </Typography>
                    <TextField
                        fullWidth
                        label="Reason for cancellation (optional)"
                        multiline
                        rows={3}
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCancelDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCancelOrder} color="error" variant="contained">
                        Confirm Cancellation
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
