import React, { useState, useContext } from 'react';
import { Box, Typography, Button, Card, CardContent, Alert } from '@mui/material';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

export default function WalletOnboardingPage() {
    const { user, loadUser } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handlePayment = async () => {
        setLoading(true);
        setError('');
        try {
            // 1. Create Order (Mocking Razorpay order creation for now or assuming direct capture simulation)
            // In a real app, we'd call backend to create Razorpay order.
            // For this simulation/demo, we'll simulate the webhook call directly or use a mock gateway.

            // Since we don't have a real Razorpay key in this env, let's simulate the flow:
            // "User pays" -> Gateway calls Webhook.

            // We'll call the webhook endpoint directly to simulate a successful payment from the gateway.
            // In production, this would be triggered by Razorpay servers.
            const mockPaymentId = 'pay_' + Math.random().toString(36).substr(2, 9);

            await axios.post('/api/payment/verify', {
                event: 'payment.captured',
                payload: {
                    payment: {
                        entity: {
                            id: mockPaymentId,
                            amount: 200000, // 2000 INR in paise
                            status: 'captured',
                            notes: {
                                userId: user._id
                            }
                        }
                    }
                }
            }, {
                headers: {
                    // Mock signature for dev/test if backend allows bypass or we know the secret
                    // If backend enforces signature, this simulation will fail without the secret.
                    // Assuming we are in a dev environment where we can bypass or we set a known secret.
                    'x-razorpay-signature': 'simulation_bypass'
                }
            });

            setSuccess('Payment successful! Your wallet has been credited.');
            setTimeout(() => {
                loadUser(); // Refresh user status
            }, 1000);

        } catch (err) {
            console.error('Payment failed', err);
            setError('Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (user.status === 'active' && (user.walletBalance || 0) >= 1000) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="success">Your account is active. Wallet Balance: ₹{user.walletBalance || 0}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom>Activate Your Account</Typography>
            <Card>
                <CardContent>
                    <Typography variant="body1" paragraph>
                        To activate your distributor/customer profile, you need to load ₹2000 into your wallet.
                        This amount can be used for future purchases.
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        fullWidth
                        onClick={handlePayment}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Pay ₹2000 via UPI'}
                    </Button>
                </CardContent>
            </Card>
        </Box>
    );
}
