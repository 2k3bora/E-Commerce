import React, { useState, useEffect, useContext } from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress, Alert, TextField, Button, Grid } from '@mui/material';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

export default function WalletPage() {
  const { user } = useContext(AuthContext);
  const [walletData, setWalletData] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [withdrawals, setWithdrawals] = useState([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [deposits, setDeposits] = useState([]);
  const [appConfig, setAppConfig] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminStats();
    } else {
      fetchWalletData();
    }
    fetchWithdrawals();
    fetchDeposits();
    fetchAppConfig();
  }, [user]);

  const fetchAdminStats = async () => {
    try {
      const res = await axios.get('/api/wallet/admin/stats');
      setAdminStats(res.data);
    } catch (err) {
      console.error('Error fetching admin stats', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletData = async () => {
    try {
      const res = await axios.get('/api/wallet');
      setWalletData(res.data);
    } catch (err) {
      console.error('Error fetching wallet data', err);
      setError('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await axios.get('/api/wallet/withdrawals');
      setWithdrawals(res.data);
    } catch (err) {
      console.error('Fetch withdrawals failed', err);
    }
  };

  const fetchDeposits = async () => {
    try {
      const res = await axios.get('/api/wallet/deposits');
      setDeposits(res.data);
    } catch (err) {
      console.error('Fetch deposits failed', err);
    }
  };

  const fetchAppConfig = async () => {
    try {
      const res = await axios.get('/api/app/config');
      setAppConfig(res.data);
    } catch (err) {
      console.error('Fetch app config failed', err);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || !transactionId) return alert('Enter amount and transaction ID');
    try {
      await axios.post('/api/wallet/deposit', {
        amount: parseFloat(depositAmount),
        transactionId,
        paymentMethod: 'UPI/Bank Transfer'
      });
      alert('Deposit request submitted! Admin will approve shortly.');
      setDepositAmount('');
      setTransactionId('');
      fetchDeposits();
    } catch (err) {
      console.error('Deposit failed', err);
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !bankDetails) return alert('Enter amount and bank details');
    try {
      await axios.post('/api/wallet/withdraw', { amount: parseFloat(withdrawAmount), bankDetails });
      alert('Withdrawal request submitted');
      setWithdrawAmount('');
      setBankDetails('');
      fetchWalletData();
      fetchWithdrawals();
    } catch (err) {
      console.error('Withdraw failed', err);
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>;

  const upiId = appConfig?.adminUpiId || 'company@upi';
  const companyName = appConfig?.siteName || 'E-Commerce';

  // Admin View
  if (user?.role === 'admin' && adminStats) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Wallet Management</Typography>

        <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
          <Card sx={{ minWidth: 250, bgcolor: 'success.main', color: 'success.contrastText' }}>
            <CardContent>
              <Typography variant="h6">Total Customer Deposits</Typography>
              <Typography variant="h3">₹{adminStats.totalDeposits?.toFixed(2) || '0.00'}</Typography>
              <Typography variant="caption">{adminStats.depositCount} transactions</Typography>
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 250, bgcolor: 'error.main', color: 'error.contrastText' }}>
            <CardContent>
              <Typography variant="h6">Total Customer Withdrawals</Typography>
              <Typography variant="h3">₹{adminStats.totalWithdrawals?.toFixed(2) || '0.00'}</Typography>
              <Typography variant="caption">{adminStats.withdrawalCount} transactions</Typography>
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 250, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <CardContent>
              <Typography variant="h6">Net Flow</Typography>
              <Typography variant="h3">₹{adminStats.netFlow?.toFixed(2) || '0.00'}</Typography>
              <Typography variant="caption">Deposits - Withdrawals</Typography>
            </CardContent>
          </Card>

          <Card sx={{ minWidth: 250, bgcolor: 'warning.main', color: 'warning.contrastText' }}>
            <CardContent>
              <Typography variant="h6">Pending Requests</Typography>
              <Typography variant="h4">{adminStats.pendingDeposits} Deposits</Typography>
              <Typography variant="h4">{adminStats.pendingWithdrawals} Withdrawals</Typography>
            </CardContent>
          </Card>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>Pending Deposit Requests</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Transaction ID</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deposits.filter(d => d.status === 'pending').length > 0 ? deposits.filter(d => d.status === 'pending').map((d) => (
                    <TableRow key={d._id}>
                      <TableCell>{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{d.user?.name || d.user?.email || 'Unknown'}</TableCell>
                      <TableCell>₹{d.amount}</TableCell>
                      <TableCell>{d.transactionId}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={async () => {
                              try {
                                await axios.post(`/api/wallet/deposits/${d._id}/approve`);
                                alert('Deposit approved');
                                fetchDeposits();
                                fetchAdminStats();
                              } catch (err) {
                                alert('Failed: ' + (err.response?.data?.message || err.message));
                              }
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            onClick={async () => {
                              if (!window.confirm('Reject this deposit?')) return;
                              try {
                                await axios.post(`/api/wallet/deposits/${d._id}/reject`);
                                alert('Deposit rejected');
                                fetchDeposits();
                                fetchAdminStats();
                              } catch (err) {
                                alert('Failed: ' + (err.response?.data?.message || err.message));
                              }
                            }}
                          >
                            Reject
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No pending deposits</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>Pending Withdrawal Requests</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {withdrawals.filter(w => w.status === 'pending').length > 0 ? withdrawals.filter(w => w.status === 'pending').map((w) => (
                    <TableRow key={w._id}>
                      <TableCell>{new Date(w.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{w.user?.name || w.user?.email || 'Unknown'}</TableCell>
                      <TableCell>₹{w.amount}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={async () => {
                              try {
                                await axios.post(`/api/wallet/withdraw/${w._id}/approve`);
                                alert('Withdrawal approved');
                                fetchWithdrawals();
                                fetchAdminStats();
                              } catch (err) {
                                alert('Failed: ' + (err.response?.data?.message || err.message));
                              }
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            onClick={async () => {
                              if (!window.confirm('Reject this withdrawal?')) return;
                              try {
                                await axios.post(`/api/wallet/withdraw/${w._id}/reject`);
                                alert('Withdrawal rejected');
                                fetchWithdrawals();
                                fetchAdminStats();
                              } catch (err) {
                                alert('Failed: ' + (err.response?.data?.message || err.message));
                              }
                            }}
                          >
                            Reject
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No pending withdrawals</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>All Deposit Requests</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Transaction ID</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deposits.length > 0 ? deposits.map((d) => (
                    <TableRow key={d._id}>
                      <TableCell>{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{d.user?.name || d.user?.email || 'Unknown'}</TableCell>
                      <TableCell>₹{d.amount}</TableCell>
                      <TableCell>{d.transactionId}</TableCell>
                      <TableCell>
                        <Chip
                          label={d.status.toUpperCase()}
                          color={d.status === 'approved' ? 'success' : d.status === 'rejected' ? 'error' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No deposit requests</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>All Withdrawal Requests</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {withdrawals.length > 0 ? withdrawals.map((w) => (
                    <TableRow key={w._id}>
                      <TableCell>{new Date(w.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{w.user?.name || w.user?.email || 'Unknown'}</TableCell>
                      <TableCell>₹{w.amount}</TableCell>
                      <TableCell>
                        <Chip
                          label={w.status.toUpperCase()}
                          color={w.status === 'approved' ? 'success' : w.status === 'rejected' ? 'error' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No withdrawal requests</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Regular User View
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>My Wallet</Typography>

      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Card sx={{ minWidth: 250, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <CardContent>
            <Typography variant="h6">Current Balance</Typography>
            <Typography variant="h3">₹{walletData?.balance?.toFixed(2) || '0.00'}</Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 250 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary">Loyalty Points</Typography>
            <Typography variant="h3" color="secondary.main">{walletData?.loyaltyPoints || 0}</Typography>
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ mb: 3, bgcolor: 'success.light' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>💰 Add Money to Wallet</Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Scan the QR code below to pay via UPI, or transfer to our bank account and enter the transaction ID.
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Amount (₹)"
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Transaction ID / UPI Reference"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  fullWidth
                  placeholder="e.g., UPI123456789"
                />
                <Button variant="contained" color="success" onClick={handleDeposit} fullWidth>
                  Submit Deposit Request
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                p: 2,
                bgcolor: 'white',
                borderRadius: 2
              }}>
                <Typography variant="subtitle1" fontWeight="bold">Scan to Pay via UPI</Typography>
                {depositAmount && parseFloat(depositAmount) > 0 ? (
                  <>
                    <QRCodeSVG
                      value={`upi://pay?pa=${upiId}&pn=${companyName}&am=${depositAmount}&cu=INR&tn=Wallet+Deposit`}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Amount: ₹{depositAmount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" textAlign="center">
                      UPI ID: {upiId}
                    </Typography>
                  </>
                ) : (
                  <Box sx={{
                    width: 200,
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.100',
                    borderRadius: 2
                  }}>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Enter amount to<br />generate QR code
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">Request Withdrawal</Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Amount"
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />
            <TextField
              label="Bank Details (UPI/Account)"
              value={bankDetails}
              onChange={(e) => setBankDetails(e.target.value)}
              fullWidth
            />
            <Button variant="contained" onClick={handleWithdraw}>Request</Button>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>Transaction History</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {walletData?.transactions?.length > 0 ? (
                  walletData.transactions.map((tx) => (
                    <TableRow key={tx._id}>
                      <TableCell>{new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={tx.type.toUpperCase()}
                          color={tx.type === 'credit' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell align="right" sx={{ color: tx.type === 'credit' ? 'success.main' : 'error.main', fontWeight: 'bold' }}>
                        {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No transactions found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>Deposit Requests</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Transaction ID</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deposits.length > 0 ? deposits.map((d) => (
                  <TableRow key={d._id}>
                    <TableCell>{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>₹{d.amount}</TableCell>
                    <TableCell>{d.transactionId}</TableCell>
                    <TableCell>
                      <Chip
                        label={d.status.toUpperCase()}
                        color={d.status === 'approved' ? 'success' : d.status === 'rejected' ? 'error' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No deposit requests</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>Withdrawal Requests</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {withdrawals.map((w) => (
                  <TableRow key={w._id}>
                    <TableCell>{new Date(w.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>₹{w.amount}</TableCell>
                    <TableCell>
                      <Chip
                        label={w.status.toUpperCase()}
                        color={w.status === 'approved' ? 'success' : w.status === 'rejected' ? 'error' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
}