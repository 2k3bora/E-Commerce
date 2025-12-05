import React, { useState } from 'react';
import { Box, IconButton, MobileStepper } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';

export default function ProductImageCarousel({ images = [], productName = '' }) {
    const [activeStep, setActiveStep] = useState(0);
    const maxSteps = images.length;

    if (!images || images.length === 0) {
        return (
            <Box
                sx={{
                    width: '100%',
                    height: 400,
                    bgcolor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1
                }}
            >
                No Image Available
            </Box>
        );
    }

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    return (
        <Box sx={{ width: '100%', position: 'relative' }}>
            {/* Main Image */}
            <Box
                component="img"
                sx={{
                    width: '100%',
                    height: 400,
                    objectFit: 'contain',
                    bgcolor: '#f5f5f5',
                    borderRadius: 1
                }}
                src={images[activeStep]}
                alt={`${productName} - Image ${activeStep + 1}`}
            />

            {/* Navigation Arrows */}
            {maxSteps > 1 && (
                <>
                    <IconButton
                        onClick={handleBack}
                        disabled={activeStep === 0}
                        sx={{
                            position: 'absolute',
                            left: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(255, 255, 255, 0.8)',
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.95)' }
                        }}
                    >
                        <KeyboardArrowLeft />
                    </IconButton>
                    <IconButton
                        onClick={handleNext}
                        disabled={activeStep === maxSteps - 1}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(255, 255, 255, 0.8)',
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.95)' }
                        }}
                    >
                        <KeyboardArrowRight />
                    </IconButton>

                    {/* Stepper */}
                    <MobileStepper
                        steps={maxSteps}
                        position="static"
                        activeStep={activeStep}
                        sx={{ bgcolor: 'transparent', justifyContent: 'center', mt: 1 }}
                        nextButton={<div />}
                        backButton={<div />}
                    />
                </>
            )}

            {/* Thumbnail Gallery */}
            {maxSteps > 1 && (
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1,
                        mt: 2,
                        overflowX: 'auto',
                        pb: 1
                    }}
                >
                    {images.map((image, index) => (
                        <Box
                            key={index}
                            component="img"
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            onClick={() => setActiveStep(index)}
                            sx={{
                                width: 80,
                                height: 80,
                                objectFit: 'cover',
                                borderRadius: 1,
                                cursor: 'pointer',
                                border: activeStep === index ? '2px solid' : '1px solid',
                                borderColor: activeStep === index ? 'primary.main' : 'divider',
                                opacity: activeStep === index ? 1 : 0.6,
                                '&:hover': { opacity: 1 }
                            }}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
}
