try {
    require('./routes/orders');
    console.log('Orders route loaded successfully');
} catch (err) {
    console.error('Failed to load orders route:', err);
}
