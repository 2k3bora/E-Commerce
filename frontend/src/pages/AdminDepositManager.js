import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Paper } from '@mui/material';

export default function AdminDepositManager() {
    const [deposits, setDeposits] = useState([]);

    useEffect(() => {
        fetchDeposits();
    }, []);

    const fetchDeposits = async () => {
        try {
            const res = await axios.get('/api/wallet/deposits/pending');
            setDeposits(res.data);
        } catch (err) {
            console.error('Fetch deposits failed', err);
        }
    };

    const handleApprove = async (id) => {
        try {
            await axios.post(`/api/wallet/deposits/${id}/approve`);
            alert('Deposit Approved');
            fetchDeposits();
        } catch (err) {
            console.error('Approve failed', err);
            alert('Failed to approve');
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Reject this deposit?')) return;
        try {
            await axios.post(`/api/wallet/deposits/${id}/reject`);
            alert('Deposit Rejected');
            fetchDeposits();
        } catch (err) {
            console.error('Reject failed', err);
            alert('Failed to reject');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Manage Deposits</Typography>
            <Paper sx={{ p: 2 }}>
                {deposits.length === 0 ? <Typography>No pending deposits.</Typography> : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Customer</TableCell>
                                <TableCell>Requested By (Branch)</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>Transaction ID</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {deposits.map(d => (
                                <TableRow key={d._id}>
                                    <TableCell>{d.user?.name} ({d.user?.email})</TableCell>
                                    <TableCell>{d.requestedBy?.name} ({d.requestedBy?.email})</TableCell>
                                    <TableCell>₹{d.amount}</TableCell>
                                    <TableCell>{d.transactionId}</TableCell>
                                    <TableCell>{new Date(d.createdAt).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Button variant="contained" color="success" size="small" onClick={() => handleApprove(d._id)} sx={{ mr: 1 }}>
                                            Approve
                                        </Button>
                                        <Button variant="contained" color="error" size="small" onClick={() => handleReject(d._id)}>
                                            Reject
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
