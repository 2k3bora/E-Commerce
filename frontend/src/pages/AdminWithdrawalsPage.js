import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button, Paper, TableContainer } from '@mui/material';

export default function AdminWithdrawalsPage() {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await axios.get('/api/wallet/withdrawals');
            setRequests(res.data);
        } catch (err) {
            console.error('Fetch requests failed', err);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Approve this withdrawal?')) return;
        try {
            await axios.post(`/api/wallet/withdraw/${id}/approve`);
            fetchRequests();
        } catch (err) {
            alert('Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Reject this withdrawal?')) return;
        try {
            await axios.post(`/api/wallet/withdraw/${id}/reject`);
            fetchRequests();
        } catch (err) {
            alert('Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Withdrawal Requests</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>User</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Bank Details</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {requests.map((r) => (
                            <TableRow key={r._id}>
                                <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>{r.user?.name} ({r.user?.email})</TableCell>
                                <TableCell>{r.amount}</TableCell>
                                <TableCell>{r.bankDetails}</TableCell>
                                <TableCell>{r.status}</TableCell>
                                <TableCell>
                                    {r.status === 'pending' && (
                                        <>
                                            <Button size="small" color="success" onClick={() => handleApprove(r._id)}>Approve</Button>
                                            <Button size="small" color="error" onClick={() => handleReject(r._id)}>Reject</Button>
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
