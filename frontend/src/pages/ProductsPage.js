import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, TextField, Button, Grid, Card, CardContent, CardActions, Dialog, DialogTitle, DialogContent, DialogActions, CardMedia, Chip, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

// Separate component for product card to properly use hooks
function ProductCard({ product, onEdit, onDelete, currentUserId }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = product.images || [];
  const isOwner = product.createdBy?._id === currentUserId || product.createdBy === currentUserId;

  return (
    <Card>
      {images.length > 0 && (
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height="200"
            image={images[currentImageIndex]}
            alt={product.name}
            sx={{ objectFit: 'cover' }}
          />
          {images.length > 1 && (
            <Box sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              display: 'flex',
              gap: 0.5,
              bgcolor: 'rgba(0,0,0,0.5)',
              borderRadius: 1,
              p: 0.5
            }}>
              {images.map((_, idx) => (
                <Box
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: idx === currentImageIndex ? 'white' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      )}
      <CardContent>
        <Typography variant="h6">{product.name}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {product.description}
        </Typography>
        {product.createdBy && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontStyle: 'italic' }}>
            Created by: {product.createdBy.name || product.createdBy.username || product.createdBy.email}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
          {product.sku && <Chip label={`SKU: ${product.sku}`} size="small" />}
          {product.basePrice && <Chip label={`₹${product.basePrice}`} size="small" color="primary" />}
          <Chip
            label={`Stock: ${product.stock || 0}`}
            size="small"
            color={(product.stock || 0) <= (product.lowStockThreshold || 10) ? 'error' : 'success'}
          />
        </Box>
      </CardContent>
      {isOwner && (
        <CardActions>
          <Button size="small" onClick={() => onEdit(product)}>Edit</Button>
          <Button size="small" color="error" onClick={() => onDelete(product._id)}>Delete</Button>
        </CardActions>
      )}
    </Card>
  );
}

export default function ProductsPage() {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    images: [],
    sku: '',
    basePrice: 0,
    stock: 0,
    lowStockThreshold: 10,
    active: true
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/products');
      setProducts(res.data || []);
    } catch (err) { console.error('Load products', err); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleOpenNew = () => {
    setEditing(null);
    setForm({
      name: '',
      description: '',
      images: [],
      sku: '',
      basePrice: 0,
      stock: 0,
      lowStockThreshold: 10,
      active: true
    });
    setOpen(true);
  };

  const handleEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || '',
      images: p.images || [],
      sku: p.sku || '',
      basePrice: p.basePrice || 0,
      stock: p.stock || 0,
      lowStockThreshold: p.lowStockThreshold || 10,
      active: !!p.active
    });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await axios.put('/api/products/' + editing._id, form);
      } else {
        await axios.post('/api/products', form);
      }
      setOpen(false);
      load();
    } catch (err) {
      console.error('Save product', err);
      alert(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete product?')) return;
    try {
      await axios.delete('/api/products/' + id);
      load();
    } catch (err) {
      console.error('Delete', err);
      alert('Failed to delete');
    }
  };

  const handleImageUpload = (e) => {
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
      setForm({ ...form, images: [...(form.images || []), ...results] });
    });
  };

  const handleRemoveImage = (index) => {
    const newImages = form.images.filter((_, i) => i !== index);
    setForm({ ...form, images: newImages });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Products</Typography>
        {(user && ['admin', 'distributor'].includes((user.role || '').toString().toLowerCase())) && (
          <Button variant="contained" onClick={handleOpenNew}>New Product</Button>
        )}
      </Box>

      <Grid container spacing={2}>
        {products.map(p => (
          <Grid item xs={12} md={4} key={p._id}>
            <ProductCard
              product={p}
              onEdit={handleEdit}
              onDelete={handleDelete}
              currentUserId={user?._id}
            />
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editing ? 'Edit Product' : 'New Product'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Name"
              placeholder="e.g. iPhone 15 Pro"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Description"
              placeholder="Product description..."
              multiline
              rows={3}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Product Images ({form.images?.length || 0})
              </Typography>

              {/* Image Gallery */}
              {form.images && form.images.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {form.images.map((img, idx) => (
                    <Box key={idx} sx={{ position: 'relative' }}>
                      <img
                        src={img}
                        alt={`Product ${idx + 1}`}
                        style={{
                          width: 100,
                          height: 100,
                          objectFit: 'cover',
                          borderRadius: 8,
                          border: '2px solid #e0e0e0'
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveImage(idx)}
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

              <Button variant="outlined" component="label">
                Upload Images (Multiple)
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                />
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                You can select multiple images at once
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Base Price (₹)"
              type="number"
              placeholder="e.g. 999"
              value={form.basePrice || ''}
              onChange={e => setForm({ ...form, basePrice: parseFloat(e.target.value) || 0 })}
            />
            <TextField
              fullWidth
              label="SKU"
              placeholder="e.g. PROD-001"
              value={form.sku}
              onChange={e => setForm({ ...form, sku: e.target.value })}
            />
            <TextField
              fullWidth
              label="Stock Quantity"
              type="number"
              placeholder="e.g. 100"
              helperText="Current available stock"
              value={form.stock || 0}
              onChange={e => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
            />
            <TextField
              fullWidth
              label="Low Stock Threshold"
              type="number"
              placeholder="e.g. 10"
              helperText="Alert when stock falls below this number"
              value={form.lowStockThreshold || 10}
              onChange={e => setForm({ ...form, lowStockThreshold: parseInt(e.target.value) || 10 })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}