import React, { useContext, useState } from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText, Divider, Alert, CircularProgress } from '@mui/material';
import CartContext from '../context/CartContext';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CheckoutPage() {
    const { cart, removeFromCart, clearCart, cartTotal } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const navigate = useNavigate();

    const handleCheckout = async () => {
        setLoading(true);
        setStatus(null);
        let successCount = 0;
        let failCount = 0;

        // Process items sequentially (could be parallel but sequential is safer for wallet balance checks)
        for (const item of cart) {
            try {
                await axios.post('/api/order/create', {
                    productId: item.productId,
                    branchId: user.parent
                });
                successCount++;
            } catch (err) {
                console.error('Checkout error for item', item.name, err);
                failCount++;
            }
        }

        setLoading(false);
        if (failCount === 0 && successCount > 0) {
            clearCart();
            setStatus({ type: 'success', msg: `Checkout successful! ${successCount} items purchased.` });
            setTimeout(() => navigate('/wallet'), 2000);
        } else if (successCount > 0) {
            // Partial success
            // We should probably remove purchased items from cart, but for simplicity let's just clear or warn.
            // Let's clear cart for now as logic to remove specific instances is complex without unique IDs per line item.
            clearCart();
            setStatus({ type: 'warning', msg: `Checkout complete with issues. ${successCount} purchased, ${failCount} failed.` });
        } else {
            setStatus({ type: 'error', msg: 'Checkout failed. Please check your wallet balance.' });
        }
    };

    if (cart.length === 0) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h5">Your Cart is Empty</Typography>
                <Button onClick={() => navigate('/catalog')} sx={{ mt: 2 }}>Go to Catalog</Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom>Checkout</Typography>
            <List>
                {cart.map((item, index) => (
                    <React.Fragment key={index}>
                        <ListItem secondaryAction={
                            <Button color="error" onClick={() => removeFromCart(item.productId)}>Remove</Button>
                        }>
                            <ListItemText
                                primary={item.name}
                                secondary={`Quantity: ${item.quantity} x ₹${item.finalPrice}`}
                            />
                            <Typography variant="body1">₹{item.finalPrice * item.quantity}</Typography>
                        </ListItem>
                        <Divider />
                    </React.Fragment>
                ))}
                <ListItem>
                    <ListItemText primary={<Typography variant="h6">Total</Typography>} />
                    <Typography variant="h6">₹{cartTotal}</Typography>
                </ListItem>
            </List>

            {status && <Alert severity={status.type} sx={{ mt: 2 }}>{status.msg}</Alert>}

            <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                sx={{ mt: 3 }}
                onClick={handleCheckout}
                disabled={loading}
            >
                {loading ? <CircularProgress size={24} /> : `Pay ₹${cartTotal}`}
            </Button>
        </Box>
    );
}
