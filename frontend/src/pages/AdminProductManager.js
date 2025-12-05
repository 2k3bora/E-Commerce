import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Box, Typography, Button, TextField, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Switch, FormControlLabel, IconButton, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AuthContext from '../context/AuthContext';

export default function AdminProductManager() {
    const { user } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentProduct, setCurrentProduct] = useState({ name: '', description: '', images: [], sku: '', basePrice: '', stock: 0, lowStockThreshold: 10, active: true });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await axios.get('/api/products');
            setProducts(res.data);
        } catch (err) {
            console.error('Fetch products failed', err);
        }
    };

    const handleOpen = (product = null) => {
        if (product) {
            setEditMode(true);
            setCurrentProduct(product);
        } else {
            setEditMode(false);
            setCurrentProduct({ name: '', description: '', images: [], sku: '', basePrice: '', stock: 0, lowStockThreshold: 10, active: true });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSave = async () => {
        try {
            if (editMode) {
                await axios.put(`/api/products/${currentProduct._id}`, currentProduct);
            } else {
                await axios.post('/api/products', currentProduct);
            }
            fetchProducts();
            handleClose();
        } catch (err) {
            console.error('Save product failed', err);
            alert('Failed to save product');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await axios.delete(`/api/products/${id}`);
            fetchProducts();
        } catch (err) {
            console.error('Delete product failed', err);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Product Manager</Typography>
                <Button variant="contained" color="primary" onClick={() => handleOpen()}>Add Product</Button>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Retail Price*:</strong> This is what customers see. Calculated as Base Price + Commissions (Company 5% + Distributor 3% + Branch 2% = 10% total).
            </Alert>

            <Card>
                <CardContent>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Image</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Creator</TableCell>
                                <TableCell>SKU</TableCell>
                                <TableCell>Base Price</TableCell>
                                <TableCell>Retail Price*</TableCell>
                                <TableCell>Stock</TableCell>
                                <TableCell>Active</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.map((p) => (
                                <TableRow key={p._id}>
                                    <TableCell>
                                        {p.images && p.images.length > 0 && (
                                            <img src={p.images[0]} alt={p.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                                        )}
                                    </TableCell>
                                    <TableCell>{p.name}</TableCell>
                                    <TableCell>
                                        <Typography variant="caption" color={p.createdBy === user._id ? 'primary' : 'text.secondary'}>
                                            {p.createdBy === user._id ? 'You' : 'Other'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{p.sku || '-'}</TableCell>
                                    <TableCell>₹{p.basePrice || 0}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="primary">
                                            ₹{p.basePrice ? (p.basePrice * 1.10).toFixed(2) : 0}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            (Base + 10% commissions)
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {p.stock || 0}
                                            {(p.stock || 0) <= (p.lowStockThreshold || 10) && (
                                                <Box sx={{
                                                    bgcolor: 'error.main',
                                                    color: 'white',
                                                    px: 1,
                                                    py: 0.5,
                                                    borderRadius: 1,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold'
                                                }}>
                                                    LOW
                                                </Box>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>{p.active ? 'Yes' : 'No'}</TableCell>
                                    <TableCell>
                                        {(p.createdBy === user._id || user.role === 'admin') ? (
                                            <>
                                                <Button size="small" onClick={() => handleOpen(p)}>Edit</Button>
                                                <Button size="small" color="error" onClick={() => handleDelete(p._id)}>Delete</Button>
                                            </>
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">
                                                Read Only
                                            </Typography>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>{editMode ? 'Edit Product' : 'Add Product'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 400 }}>
                        <TextField
                            label="Name"
                            placeholder="e.g. iPhone 15 Pro"
                            helperText="The name of the product as it will appear in the catalog"
                            value={currentProduct.name}
                            onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Description"
                            placeholder="e.g. The latest iPhone with titanium design..."
                            helperText="Detailed description of the product features"
                            value={currentProduct.description}
                            onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                            fullWidth
                            multiline
                            rows={3}
                        />
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="textSecondary">Product Images ({currentProduct.images?.length || 0})</Typography>

                            {/* Image Gallery */}
                            {currentProduct.images && currentProduct.images.length > 0 && (
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 2 }}>
                                    {currentProduct.images.map((img, idx) => (
                                        <Box key={idx} sx={{ position: 'relative' }}>
                                            <img
                                                src={img}
                                                alt={`Product ${idx + 1}`}
                                                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '2px solid #e0e0e0' }}
                                            />
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    const newImages = currentProduct.images.filter((_, i) => i !== idx);
                                                    setCurrentProduct({ ...currentProduct, images: newImages });
                                                }}
                                                sx={{
                                                    position: 'absolute',
                                                    top: -8,
                                                    right: -8,
                                                    bgcolor: 'error.main',
                                                    color: 'white',
                                                    '&:hover': { bgcolor: 'error.dark' }
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    ))}
                                </Box>
                            )}

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                                <Button variant="outlined" component="label">
                                    Upload Images (Multiple)
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files);
                                            if (files.length === 0) return;

                                            const readers = files.map(file => {
                                                return new Promise((resolve) => {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => resolve(reader.result);
                                                    reader.readAsDataURL(file);
                                                });
                                            });

                                            Promise.all(readers).then(results => {
                                                setCurrentProduct({
                                                    ...currentProduct,
                                                    images: [...(currentProduct.images || []), ...results]
                                                });
                                            });
                                        }}
                                    />
                                </Button>
                                <Typography variant="caption" color="textSecondary">
                                    Select multiple images at once
                                </Typography>
                            </Box>
                        </Box>
                        <TextField
                            label="Base Price (₹)"
                            type="number"
                            placeholder="e.g. 999"
                            helperText="The starting price before commissions"
                            value={currentProduct.basePrice || ''}
                            onChange={(e) => setCurrentProduct({ ...currentProduct, basePrice: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="SKU"
                            placeholder="e.g. PROD-001"
                            helperText="Unique Stock Keeping Unit identifier"
                            value={currentProduct.sku}
                            onChange={(e) => setCurrentProduct({ ...currentProduct, sku: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Stock Quantity"
                            type="number"
                            placeholder="e.g. 100"
                            helperText="Current available stock"
                            value={currentProduct.stock || 0}
                            onChange={(e) => setCurrentProduct({ ...currentProduct, stock: parseInt(e.target.value) || 0 })}
                            fullWidth
                        />
                        <TextField
                            label="Low Stock Threshold"
                            type="number"
                            placeholder="e.g. 10"
                            helperText="Alert when stock falls below this number"
                            value={currentProduct.lowStockThreshold || 10}
                            onChange={(e) => setCurrentProduct({ ...currentProduct, lowStockThreshold: parseInt(e.target.value) || 10 })}
                            fullWidth
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={currentProduct.active}
                                    onChange={(e) => setCurrentProduct({ ...currentProduct, active: e.target.checked })}
                                />
                            }
                            label="Active (Visible in catalog)"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
