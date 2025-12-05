const mongoose = require('mongoose');
const { Schema } = mongoose;

const configSchema = new Schema({
    staffPercentage: {
        type: Number,
        required: true,
        default: 0.01 // 1%
    },
    distributorPercentage: {
        type: Number,
        required: true,
        default: 0.02 // 2%
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

configSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Config = mongoose.model('Config', configSchema);

module.exports = Config;
