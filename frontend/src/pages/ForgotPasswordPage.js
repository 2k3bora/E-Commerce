import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');
        try {
            const res = await axios.post('/api/auth/forgot-password', { email });
            setMessage(res.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset link');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Box component="form" onSubmit={handleSubmit} sx={{ width: 320, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h5" align="center">Forgot Password</Typography>
                <Typography variant="body2" align="center" color="text.secondary">
                    Enter your email address and we'll send you a link to reset your password.
                </Typography>

                {message && <Alert severity="success">{message}</Alert>}
                {error && <Alert severity="error">{error}</Alert>}

                <TextField
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    fullWidth
                />

                <Button type="submit" variant="contained" disabled={loading} fullWidth>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <Button component={Link} to="/login" variant="text" fullWidth>
                    Back to Login
                </Button>
            </Box>
        </Box>
    );
}
