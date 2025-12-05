import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, TextField, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Switch, FormControlLabel, Chip } from '@mui/material';
import axios from 'axios';

export default function CommissionSettingsPage() {
    const [configs, setConfigs] = useState([]);
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentConfig, setCurrentConfig] = useState({
        companyShare: 0.05,
        distributorShare: 0.03,
        branchShare: 0.02,
        customerPointRate: 0.01,
        active: true,
        note: ''
    });

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        try {
            const res = await axios.get('/api/commissions');
            setConfigs(res.data || []);
        } catch (err) {
            console.error('Load configs failed', err);
        }
    };

    const handleOpen = (config = null) => {
        if (config) {
            setEditMode(true);
            setCurrentConfig(config);
        } else {
            setEditMode(false);
            setCurrentConfig({
                companyShare: 0.05,
                distributorShare: 0.03,
                branchShare: 0.02,
                customerPointRate: 0.01,
                active: true,
                note: ''
            });
        }
        setOpen(true);
    };

    const handleSave = async () => {
        try {
            console.log('Saving commission config:', currentConfig);
            let response;
            if (editMode) {
                response = await axios.put(`/api/commissions/${currentConfig._id}`, currentConfig);
            } else {
                response = await axios.post('/api/commissions', currentConfig);
            }
            console.log('Save successful:', response.data);
            loadConfigs();
            setOpen(false);
        } catch (err) {
            console.error('Save config failed', err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to save commission config';
            alert(`Error: ${errorMsg}`);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this commission config?')) return;
        try {
            await axios.delete(`/api/commissions/${id}`);
            loadConfigs();
        } catch (err) {
            console.error('Delete failed', err);
            alert(err.response?.data?.message || 'Failed to delete');
        }
    };

    const formatPercent = (value) => `${(value * 100).toFixed(2)}%`;

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Commission Settings</Typography>
                <Button variant="contained" onClick={() => handleOpen()}>
                    New Configuration
                </Button>
            </Box>

            <Card>
                <CardContent>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Status</TableCell>
                                <TableCell>Company Share</TableCell>
                                <TableCell>Distributor Share</TableCell>
                                <TableCell>Branch Share</TableCell>
                                <TableCell>Customer Points</TableCell>
                                <TableCell>Note</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {configs.map((config) => (
                                <TableRow key={config._id}>
                                    <TableCell>
                                        {config.active ? (
                                            <Chip label="Active" color="success" size="small" />
                                        ) : (
                                            <Chip label="Inactive" size="small" />
                                        )}
                                    </TableCell>
                                    <TableCell>{formatPercent(config.companyShare)}</TableCell>
                                    <TableCell>{formatPercent(config.distributorShare)}</TableCell>
                                    <TableCell>{formatPercent(config.branchShare)}</TableCell>
                                    <TableCell>{formatPercent(config.customerPointRate)}</TableCell>
                                    <TableCell>{config.note || '-'}</TableCell>
                                    <TableCell>
                                        <Button size="small" onClick={() => handleOpen(config)}>
                                            Edit
                                        </Button>
                                        {!config.active && (
                                            <Button size="small" color="error" onClick={() => handleDelete(config._id)}>
                                                Delete
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editMode ? 'Edit Configuration' : 'New Configuration'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Company Share (%)"
                            type="number"
                            value={(currentConfig.companyShare * 100).toFixed(2)}
                            onChange={(e) => setCurrentConfig({ ...currentConfig, companyShare: parseFloat(e.target.value) / 100 })}
                            helperText="Percentage of base price for company"
                            fullWidth
                        />
                        <TextField
                            label="Distributor Share (%)"
                            type="number"
                            value={(currentConfig.distributorShare * 100).toFixed(2)}
                            onChange={(e) => setCurrentConfig({ ...currentConfig, distributorShare: parseFloat(e.target.value) / 100 })}
                            helperText="Percentage of base price for distributor"
                            fullWidth
                        />
                        <TextField
                            label="Branch Share (%)"
                            type="number"
                            value={(currentConfig.branchShare * 100).toFixed(2)}
                            onChange={(e) => setCurrentConfig({ ...currentConfig, branchShare: parseFloat(e.target.value) / 100 })}
                            helperText="Percentage of base price for branch"
                            fullWidth
                        />
                        <TextField
                            label="Customer Points Rate (%)"
                            type="number"
                            value={(currentConfig.customerPointRate * 100).toFixed(2)}
                            onChange={(e) => setCurrentConfig({ ...currentConfig, customerPointRate: parseFloat(e.target.value) / 100 })}
                            helperText="Loyalty points rate for customers"
                            fullWidth
                        />
                        <TextField
                            label="Note"
                            value={currentConfig.note || ''}
                            onChange={(e) => setCurrentConfig({ ...currentConfig, note: e.target.value })}
                            helperText="Optional description for this configuration"
                            fullWidth
                            multiline
                            rows={2}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={currentConfig.active}
                                    onChange={(e) => setCurrentConfig({ ...currentConfig, active: e.target.checked })}
                                />
                            }
                            label="Set as Active Configuration"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
