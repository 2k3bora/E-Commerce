const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    // prefer email as primary identifier
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    name: {
        type: String,
        trim: true
    },
    password: {
        type: String
    },
    googleId: {
        type: String,
        index: true,
        sparse: true
    },
    profilePicture: {
        type: String
    },
    authProvider: {
        type: String,
        enum: ['google', 'local', 'dev'],
        default: 'local'
    },
    // role: keep legacy values but accept canonical values as well
    role: {
        type: String,
        enum: ['admin', 'distributor', 'branch', 'customer', 'Company', 'Distributor', 'Staff', 'Customer'],
        required: true,
        default: 'customer'
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null // top-level admin will have a null parent
    },
    // account lifecycle status used for onboarding (pending -> active)
    status: {
        type: String,
        enum: ['pending', 'active', 'suspended', 'inactive'],
        default: 'pending'
    },
    metadata: {
        type: Schema.Types.Mixed
    },
    // When true, user must change their password on next login (default false)
    mustChangePassword: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

const User = mongoose.model('User', userSchema);

module.exports = User;
