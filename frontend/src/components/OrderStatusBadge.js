import React from 'react';
import { Chip } from '@mui/material';

const statusConfig = {
    created: { label: 'Created', color: 'default' },
    paid: { label: 'Paid', color: 'info' },
    processing: { label: 'Processing', color: 'warning' },
    shipped: { label: 'Shipped', color: 'primary' },
    delivered: { label: 'Delivered', color: 'success' },
    cancelled: { label: 'Cancelled', color: 'error' },
    refunded: { label: 'Refunded', color: 'secondary' },
    fulfilled: { label: 'Fulfilled', color: 'success' }
};

export default function OrderStatusBadge({ status }) {
    const config = statusConfig[status] || { label: status, color: 'default' };

    return (
        <Chip
            label={config.label}
            color={config.color}
            size="small"
            sx={{ fontWeight: 500 }}
        />
    );
}
