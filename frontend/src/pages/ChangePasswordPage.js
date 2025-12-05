import React, { useState, useContext } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ChangePasswordPage = () => {
  const { token, logout } = useContext(AuthContext);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post('/api/auth/change-password', { oldPassword, newPassword }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Password changed. Please login again.');
      logout();
      navigate('/login');
    } catch (err) {
      console.error('Change password error', err);
      alert(err.response?.data?.message || 'Could not change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: 360 }}>
        <Typography variant="h6">Change Password</Typography>
        <TextField label="Current Password" type="password" value={oldPassword} onChange={e=>setOldPassword(e.target.value)} required />
        <TextField label="New Password" type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required />
        <Button type="submit" variant="contained" disabled={loading}>Change Password</Button>
      </Box>
    </Box>
  );
};

export default ChangePasswordPage;
