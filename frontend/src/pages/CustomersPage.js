import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

export default function CustomersPage() {
  // const { user } = useContext(AuthContext); // user unused
  const [customers, setCustomers] = useState([]);

  const load = async () => {
    try {
      const res = await axios.get('/api/customers');
      setCustomers(res.data || []);
    } catch (err) { console.error('Load customers', err); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const changeStatus = async (id, status) => {
    try {
      await axios.patch(`/api/customers/${id}/status`, { status });
      load();
    } catch (err) { console.error('Change status', err); alert('Failed'); }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Customers</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Balance</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {customers.map(c => (
            <TableRow key={c._id}>
              <TableCell>{c.name || c.username}</TableCell>
              <TableCell>{c.email}</TableCell>
              <TableCell>₹{c.balance?.toFixed ? c.balance.toFixed(2) : c.balance}</TableCell>
              <TableCell>{c.status}</TableCell>
              <TableCell>
                <Button size="small" onClick={() => changeStatus(c._id, 'active')}>Activate</Button>
                <Button size="small" color="warning" onClick={() => changeStatus(c._id, 'suspended')}>Suspend</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}