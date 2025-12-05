import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalProducts: 0,
        totalCustomers: 0,
        totalDistributors: 0,
        totalBranches: 0
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            // Fetch users
            const usersRes = await axios.get('/api/admin/users');
            const users = usersRes.data || [];

            // Fetch products
            const productsRes = await axios.get('/api/products');
            const products = productsRes.data || [];

            setStats({
                totalUsers: users.length,
                totalProducts: products.length,
                totalCustomers: users.filter(u => u.role === 'customer').length,
                totalDistributors: users.filter(u => u.role === 'distributor').length,
                totalBranches: users.filter(u => u.role === 'branch').length
            });
        } catch (err) {
            console.error('Load stats failed', err);
        }
    };

    const StatCard = ({ title, value, color = 'primary' }) => (
        <Card>
            <CardContent>
                <Typography color="textSecondary" gutterBottom>
                    {title}
                </Typography>
                <Typography variant="h3" color={color}>
                    {value}
                </Typography>
            </CardContent>
        </Card>
    );

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Admin Dashboard
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Users" value={stats.totalUsers} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Products" value={stats.totalProducts} color="secondary" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Distributors" value={stats.totalDistributors} color="success" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Branches" value={stats.totalBranches} color="info" />
                </Grid>
            </Grid>

            <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                Quick Actions
            </Typography>
            <Grid container spacing={2}>
                <Grid item>
                    <Button variant="contained" onClick={() => navigate('/products')}>
                        Manage Products
                    </Button>
                </Grid>
                <Grid item>
                    <Button variant="contained" onClick={() => navigate('/customers')}>
                        View Customers
                    </Button>
                </Grid>
                <Grid item>
                    <Button variant="contained" onClick={() => navigate('/admin/commissions')}>
                        Commission Settings
                    </Button>
                </Grid>
                <Grid item>
                    <Button variant="contained" onClick={() => navigate('/admin/deposits')}>
                        Manage Deposits
                    </Button>
                </Grid>
                <Grid item>
                    <Button variant="contained" onClick={() => navigate('/admin/withdrawals')}>
                        Manage Withdrawals
                    </Button>
                </Grid>
                <Grid item>
                    <Button variant="contained" onClick={() => navigate('/admin/settings')}>
                        Site Settings
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
}
