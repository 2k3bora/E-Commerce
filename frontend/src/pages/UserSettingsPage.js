import React, { useState, useEffect, useContext } from 'react';
import { Box, Typography, Card, CardContent, TextField, Button, Alert, CircularProgress } from '@mui/material';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

export default function UserSettingsPage() {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [profile, setProfile] = useState({
        name: '',
        email: '',
        withdrawalDetails: {
            upiId: '',
            bankAccountNumber: '',
            bankIFSC: '',
            bankAccountName: ''
        }
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await axios.get('/api/user/profile');
            setProfile({
                name: res.data.name || '',
                email: res.data.email || '',
                withdrawalDetails: res.data.withdrawalDetails || {
                    upiId: '',
                    bankAccountNumber: '',
                    bankIFSC: '',
                    bankAccountName: ''
                }
            });
        } catch (err) {
            console.error('Fetch profile error', err);
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await axios.put('/api/user/profile', {
                name: profile.name,
                withdrawalDetails: profile.withdrawalDetails
            });
            setSuccess('Settings saved successfully!');

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Save profile error', err);
            setError(err.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom>User Settings</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Profile Information</Typography>
                    <TextField
                        fullWidth
                        label="Name"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Email"
                        value={profile.email}
                        disabled
                        helperText="Email cannot be changed"
                        sx={{ mb: 2 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                        Role: {user?.role?.toUpperCase()}
                    </Typography>
                </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Withdrawal Details</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Configure your payment details for withdrawal requests
                    </Typography>

                    <TextField
                        fullWidth
                        label="UPI ID"
                        placeholder="yourname@upi"
                        value={profile.withdrawalDetails.upiId}
                        onChange={(e) => setProfile({
                            ...profile,
                            withdrawalDetails: {
                                ...profile.withdrawalDetails,
                                upiId: e.target.value
                            }
                        })}
                        sx={{ mb: 2 }}
                        helperText="Enter your UPI ID for quick withdrawals"
                    />

                    <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Or provide Bank Account Details</Typography>

                    <TextField
                        fullWidth
                        label="Bank Account Number"
                        value={profile.withdrawalDetails.bankAccountNumber}
                        onChange={(e) => setProfile({
                            ...profile,
                            withdrawalDetails: {
                                ...profile.withdrawalDetails,
                                bankAccountNumber: e.target.value
                            }
                        })}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        label="Bank IFSC Code"
                        value={profile.withdrawalDetails.bankIFSC}
                        onChange={(e) => setProfile({
                            ...profile,
                            withdrawalDetails: {
                                ...profile.withdrawalDetails,
                                bankIFSC: e.target.value.toUpperCase()
                            }
                        })}
                        sx={{ mb: 2 }}
                        placeholder="e.g., SBIN0001234"
                    />

                    <TextField
                        fullWidth
                        label="Account Holder Name"
                        value={profile.withdrawalDetails.bankAccountName}
                        onChange={(e) => setProfile({
                            ...profile,
                            withdrawalDetails: {
                                ...profile.withdrawalDetails,
                                bankAccountName: e.target.value
                            }
                        })}
                        sx={{ mb: 2 }}
                        helperText="Name as per bank records"
                    />
                </CardContent>
            </Card>

            <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleSave}
                disabled={saving}
                fullWidth
            >
                {saving ? 'Saving...' : 'Save Settings'}
            </Button>
        </Box>
    );
}
