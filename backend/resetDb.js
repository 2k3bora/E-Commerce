const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Wallet = require('./models/Wallet');
const Transaction = require('./models/Transaction');
const Product = require('./models/Product');
const Order = require('./models/Order');
const DistributorProductConfig = require('./models/DistributorProductConfig');
const CommissionConfig = require('./models/CommissionConfig');
const CommissionLedger = require('./models/CommissionLedger');

async function resetDb() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');

        console.log('Clearing database...');
        await User.deleteMany({});
        await Wallet.deleteMany({});
        await Transaction.deleteMany({});
        await Product.deleteMany({});
        await Order.deleteMany({});
        await DistributorProductConfig.deleteMany({});
        await CommissionConfig.deleteMany({});
        // await CommissionLedger.deleteMany({}); // If it exists

        console.log('Database cleared.');

        console.log('Seeding default admin...');
        const defaultAdminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@abc.com').toLowerCase();
        const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin@123';
        const defaultAdminName = process.env.DEFAULT_ADMIN_NAME || 'Administrator';

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(defaultAdminPassword, salt);

        const admin = new User({
            username: defaultAdminEmail.split('@')[0],
            email: defaultAdminEmail,
            name: defaultAdminName,
            password: hashed,
            role: 'admin',
            status: 'active',
            authProvider: 'local',
            mustChangePassword: true
        });
        await admin.save();

        // Create admin wallet
        const wallet = new Wallet({ user: admin._id, balance: 0 });
        await wallet.save();

        console.log('---------------------------------------------------');
        console.log('FRESH START COMPLETE');
        console.log('Default Admin Credentials:');
        console.log(`Email: ${defaultAdminEmail}`);
        console.log(`Password: ${defaultAdminPassword}`);
        console.log('---------------------------------------------------');

        process.exit(0);
    } catch (err) {
        console.error('Reset failed:', err);
        process.exit(1);
    }
}

resetDb();
