import React from 'react';
import { Rating } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarHalfIcon from '@mui/icons-material/StarHalf';

/**
 * StarRating Component
 * Displays star rating - can be readonly or interactive
 * @param {number} value - Current rating value (0-5)
 * @param {function} onChange - Callback for when rating changes (optional, makes it interactive)
 * @param {number} size - Star size: 'small', 'medium', 'large'
 * @param {boolean} showValue - Whether to show numeric value next to stars
 * @param {number} reviewCount - Optional review count to display
 */
export default function StarRating({
    value = 0,
    onChange,
    size = 'medium',
    showValue = false,
    reviewCount,
    precision = 0.5
}) {
    const isInteractive = !!onChange;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Rating
                value={value}
                precision={precision}
                readOnly={!isInteractive}
                onChange={(event, newValue) => {
                    if (isInteractive && newValue !== null) {
                        onChange(newValue);
                    }
                }}
                size={size}
                icon={<StarIcon fontSize="inherit" />}
                emptyIcon={<StarBorderIcon fontSize="inherit" />}
            />
            {showValue && (
                <span style={{ fontSize: size === 'small' ? '0.875rem' : '1rem', color: '#666' }}>
                    {value.toFixed(1)}
                    {reviewCount !== undefined && ` (${reviewCount})`}
                </span>
            )}
        </div>
    );
}
