import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Box, Typography, Card, CardContent, Grid, Table, TableBody, TableCell, TableHead, TableRow, TextField, Button } from '@mui/material';
import { QRCodeCanvas } from 'qrcode.react';
import AuthContext from '../context/AuthContext';

export default function BranchDashboard() {
    const { user } = useContext(AuthContext);
    const [customers, setCustomers] = useState([]);
    const [orders, setOrders] = useState([]);

    const [appConfig, setAppConfig] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const custRes = await axios.get('/api/customers');
                setCustomers(custRes.data);
                const ordRes = await axios.get('/api/order/list');
                setOrders(ordRes.data.orders || []);
                const cfgRes = await axios.get('/api/app/config');
                setAppConfig(cfgRes.data);
            } catch (err) {
                console.error('Fetch branch data failed', err);
            }
        };
        fetchData();
    }, []);

    const [onboardData, setOnboardData] = useState({ name: '', email: '', password: '', depositAmount: '', transactionId: '' });

    const handleOnboard = async (e) => {
        e.preventDefault();
        try {
            // 1. Register Customer
            const regRes = await axios.post('/api/auth/register-customer', {
                name: onboardData.name,
                email: onboardData.email,
                password: onboardData.password
            });
            const newUserId = regRes.data.user.id;

            // 2. Create Deposit Request
            if (onboardData.depositAmount && onboardData.transactionId) {
                await axios.post('/api/wallet/deposit', {
                    userId: newUserId,
                    amount: parseFloat(onboardData.depositAmount),
                    transactionId: onboardData.transactionId
                });
            }

            alert('Customer onboarded and deposit request sent!');
            setOnboardData({ name: '', email: '', password: '', depositAmount: '', transactionId: '' });
            // Refresh list
            const custRes = await axios.get('/api/customers');
            setCustomers(custRes.data);
        } catch (err) {
            console.error('Onboard failed', err);
            alert(err.response?.data?.message || 'Onboarding failed');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Branch Dashboard</Typography>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Onboard New Customer</Typography>
                    <Box component="form" onSubmit={handleOnboard} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <TextField label="Name" required value={onboardData.name} onChange={e => setOnboardData({ ...onboardData, name: e.target.value })} />
                        <TextField label="Email" required type="email" value={onboardData.email} onChange={e => setOnboardData({ ...onboardData, email: e.target.value })} />
                        <TextField label="Password" required type="password" value={onboardData.password} onChange={e => setOnboardData({ ...onboardData, password: e.target.value })} />
                        <TextField label="Initial Deposit (₹)" required type="number" value={onboardData.depositAmount} onChange={e => setOnboardData({ ...onboardData, depositAmount: e.target.value })} />
                        {onboardData.depositAmount && (
                            appConfig.adminUpiId ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                                    <QRCodeCanvas value={`upi://pay?pa=${appConfig.adminUpiId}&pn=Admin&am=${onboardData.depositAmount}&tn=Deposit`} size={128} />
                                    <Button variant="outlined" color="secondary" onClick={() => {
                                        const url = `upi://pay?pa=${appConfig.adminUpiId}&pn=Admin&am=${onboardData.depositAmount}&tn=Deposit`;
                                        window.open(url, '_blank');
                                    }}>
                                        Pay Now (App)
                                    </Button>
                                    <Typography variant="caption">Scan QR or click Pay Now</Typography>
                                </Box>
                            ) : (
                                <Typography variant="caption" color="error">
                                    Admin UPI ID not configured. Please contact admin.
                                </Typography>
                            )
                        )}
                        <TextField label="UPI Transaction ID" required value={onboardData.transactionId} onChange={e => setOnboardData({ ...onboardData, transactionId: e.target.value })} />
                        <Button type="submit" variant="contained">Onboard</Button>
                    </Box>
                </CardContent>
            </Card>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">My Customers ({customers.length})</Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>Wallet</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {customers.map(c => (
                                        <TableRow key={c._id}>
                                            <TableCell>{c.name}</TableCell>
                                            <TableCell>{c.email}</TableCell>
                                            <TableCell>₹{c.balance}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Customer Orders ({orders.length})</Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Order ID</TableCell>
                                        <TableCell>Customer</TableCell>
                                        <TableCell>Amount</TableCell>
                                        <TableCell>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {orders.map(o => (
                                        <TableRow key={o._id}>
                                            <TableCell>{o._id.substring(0, 8)}...</TableCell>
                                            <TableCell>{o.customer?.name || 'Unknown'}</TableCell>
                                            <TableCell>₹{o.finalPricePaid}</TableCell>
                                            <TableCell>{o.status}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
