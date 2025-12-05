import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Box, TextField, Button, Typography } from '@mui/material';
import AuthContext from '../context/AuthContext';

import { useNavigate } from 'react-router-dom';

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [config, setConfig] = useState({ siteName: '', siteIconUrl: '', defaultAdminEmail: '', adminUpiId: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await axios.get('/api/app/config');
        setConfig({ siteName: res.data.siteName || '', siteIconUrl: res.data.siteIconUrl || '', defaultAdminEmail: res.data.defaultAdminEmail || '', adminUpiId: res.data.adminUpiId || '' });
      } catch (err) {
        console.error('Load config error', err);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.put('/api/app/config', config);
      setConfig(res.data);
      alert('Settings saved');
    } catch (err) {
      console.error('Save error', err);
      alert('Failed to save');
    } finally { setSaving(false); }
  };

  const handleCreateAdminNow = async () => {
    if (!config.defaultAdminEmail) return alert('Set default admin email first');
    try {
      const res = await axios.post('/api/app/create-admin', { email: config.defaultAdminEmail, name: user.name || user.email });
      alert('Admin created/updated: ' + res.data.email);
    } catch (err) {
      console.error('Create admin failed', err);
      alert('Failed to create admin');
    }
  };

  // Add distributor by email
  const [distributorEmail, setDistributorEmail] = useState('');
  const [distributorPassword, setDistributorPassword] = useState('');
  const [adding, setAdding] = useState(false);
  // Branch creation
  const [distributorsList, setDistributorsList] = useState([]);
  const [branchEmail, setBranchEmail] = useState('');
  const [branchPassword, setBranchPassword] = useState('');
  const [branchDistributorId, setBranchDistributorId] = useState('');
  const [addingBranch, setAddingBranch] = useState(false);

  const handleAddDistributor = async () => {
    if (!distributorEmail) return alert('Enter distributor email');
    setAdding(true);
    try {
      const payload = { email: distributorEmail, name: distributorEmail.split('@')[0] };
      if (distributorPassword) payload.password = distributorPassword;
      const res = await axios.post('/api/admin/distributors', payload);
      alert('Distributor created: ' + res.data.user.email);
      setDistributorEmail('');
      setDistributorPassword('');
    } catch (err) {
      console.error('Add distributor failed', err);
      alert(err.response?.data?.message || 'Failed to add distributor');
    } finally { setAdding(false); }
  };

  // load distributors for branch selection
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get('/api/admin/distributors');
        if (mounted) setDistributorsList(res.data || []);
      } catch (err) { console.error('Load distributors list', err); }
    })();
    return () => mounted = false;
  }, []);

  const handleAddBranch = async () => {
    if (!branchEmail) return alert('Enter branch email');
    // if (!branchDistributorId) return alert('Select distributor'); // Removed
    setAddingBranch(true);
    try {
      const payload = { email: branchEmail, name: branchEmail.split('@')[0], password: branchPassword, distributorId: null };
      const res = await axios.post('/api/admin/branches', payload);
      alert('Branch created: ' + res.data.user.email);
      setBranchEmail(''); setBranchPassword(''); setBranchDistributorId('');
    } catch (err) { console.error('Add branch failed', err); alert(err.response?.data?.message || 'Failed to add branch'); }
    finally { setAddingBranch(false); }
  };

  if (!user) return <Typography>Please login as admin to access settings.</Typography>;
  if (user.role !== 'admin') return <Typography>Only admins can access settings.</Typography>;

  return (
    <Box sx={{ maxWidth: 700 }}>
      <Typography variant="h5" gutterBottom>Admin Settings</Typography>
      <TextField fullWidth label="Site Name" value={config.siteName} onChange={e => setConfig({ ...config, siteName: e.target.value })} sx={{ mb: 2 }} />
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="textSecondary">Site Icon</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
          {config.siteIconUrl && (
            <img src={config.siteIconUrl} alt="Icon Preview" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          )}
          <Button variant="outlined" component="label" size="small">
            Upload Icon
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setConfig({ ...config, siteIconUrl: reader.result });
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </Button>
        </Box>
      </Box>
      <TextField fullWidth label="Default Admin Email" value={config.defaultAdminEmail} onChange={e => setConfig({ ...config, defaultAdminEmail: e.target.value })} sx={{ mb: 2 }} helperText="Used as default admin created on server startup if present (seed)." />
      <TextField fullWidth label="Admin UPI ID" placeholder="e.g. yourname@upi" value={config.adminUpiId || ''} onChange={e => setConfig({ ...config, adminUpiId: e.target.value })} sx={{ mb: 2 }} helperText="UPI ID for receiving deposits from branches." />
      <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ mr: 2 }}>Save</Button>
      <Button variant="outlined" onClick={handleCreateAdminNow}>Create/Set Default Admin Now</Button>
      <Button variant="contained" color="secondary" onClick={() => navigate('/admin/products')} sx={{ ml: 2 }}>Manage Products</Button>
      <Button variant="outlined" onClick={() => navigate('/admin/withdrawals')} sx={{ ml: 2 }}>Withdrawals</Button>
      <Button variant="outlined" onClick={() => navigate('/admin/deposits')} sx={{ ml: 2 }}>Deposits</Button>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Distributors</Typography>
        <TextField fullWidth label="Distributor Email" value={distributorEmail} onChange={e => setDistributorEmail(e.target.value)} sx={{ mb: 2 }} />
        <TextField fullWidth label="Initial Password (optional)" type="password" value={distributorPassword} onChange={e => setDistributorPassword(e.target.value)} sx={{ mb: 2 }} helperText="Optional: admin can set initial password; distributor can later login or set via Google if email matches." />
        <Button variant="contained" onClick={handleAddDistributor} disabled={adding}>Add Distributor</Button>
      </Box>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Branches</Typography>
        {/* Distributor selection removed */}
        <TextField fullWidth label="Branch Email" value={branchEmail} onChange={e => setBranchEmail(e.target.value)} sx={{ mb: 2 }} />
        <TextField fullWidth label="Initial Password (optional)" type="password" value={branchPassword} onChange={e => setBranchPassword(e.target.value)} sx={{ mb: 2 }} />
        <Button variant="contained" onClick={handleAddBranch} disabled={addingBranch}>Add Branch</Button>
      </Box>

      <Box sx={{ mt: 5 }}>
        <Typography variant="h6" gutterBottom>Existing Distributors</Typography>
        {distributorsList.length === 0 ? <Typography>No distributors found.</Typography> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                <th style={{ padding: '8px' }}>Name</th>
                <th style={{ padding: '8px' }}>Email</th>
                <th style={{ padding: '8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {distributorsList.map(d => (
                <tr key={d._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{d.name}</td>
                  <td style={{ padding: '8px' }}>{d.email}</td>
                  <td style={{ padding: '8px' }}>{d.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Box>

      <BranchesList />
    </Box>
  );
}

function BranchesList() {
  const [branches, setBranches] = useState([]);
  useEffect(() => {
    axios.get('/api/admin/branches').then(res => setBranches(res.data)).catch(console.error);
  }, []);

  return (
    <Box sx={{ mt: 5 }}>
      <Typography variant="h6" gutterBottom>Existing Branches</Typography>
      {branches.length === 0 ? <Typography>No branches found.</Typography> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: '8px' }}>Name</th>
              <th style={{ padding: '8px' }}>Email</th>
              <th style={{ padding: '8px' }}>Distributor</th>
              <th style={{ padding: '8px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {branches.map(b => (
              <tr key={b._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px' }}>{b.name}</td>
                <td style={{ padding: '8px' }}>{b.email}</td>
                <td style={{ padding: '8px' }}>{b.parent?.name || b.parent?.email || 'N/A'}</td>
                <td style={{ padding: '8px' }}>{b.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Box>
  );
}
