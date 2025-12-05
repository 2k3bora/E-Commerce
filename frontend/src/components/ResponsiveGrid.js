import React from 'react';
import {
  Grid,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Avatar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const Item = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

export default function ResponsiveGrid() {
  const [stats, setStats] = React.useState({
    walletBalance: 0,
    recentOrderCount: 0,
    recentTotalSales: 0
  });

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        // We need to import axios or use fetch. Since axios is used elsewhere, let's use it.
        // But we need to import it first. 
        // If we can't easily add import at top without another tool call, we can use fetch or require.
        // Let's assume we will add import in a separate step or use window.axios if available (unlikely).
        // Better: use fetch with auth header.
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('/api/distributor/stats', {
          headers: { 'x-auth-token': token }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3}>
        {/* Column 1 - Orders Summary */}
        <Grid item xs={12} md={6}>
          <Item>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <ShoppingCartIcon />
                </Avatar>
              }
              title="Recent Orders"
              subheader="Last 7 days performance"
            />
            <CardContent>
              <Typography variant="h4" color="primary" gutterBottom>
                ₹{stats.recentTotalSales.toLocaleString()}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Total sales from {stats.recentOrderCount} orders
              </Typography>
            </CardContent>
          </Item>
        </Grid>

        {/* Column 2 - Wallet Summary */}
        <Grid item xs={12} md={6}>
          <Item>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <AccountBalanceWalletIcon />
                </Avatar>
              }
              title="Wallet Balance"
              subheader="Available for withdrawal"
            />
            <CardContent>
              <Typography variant="h4" color="secondary" gutterBottom>
                ₹{stats.walletBalance.toLocaleString()}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Includes pending commissions
              </Typography>
            </CardContent>
          </Item>
        </Grid>
      </Grid>
    </>
  );
}
