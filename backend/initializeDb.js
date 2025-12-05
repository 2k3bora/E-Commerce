// Quick script to check and initialize database with sample data
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const CommissionConfig = require('./models/CommissionConfig');
const User = require('./models/User');

async function checkAndInitialize() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Check for commission config
        const commissionCount = await CommissionConfig.countDocuments({ active: true });
        console.log(`Active commission configs: ${commissionCount}`);

        if (commissionCount === 0) {
            console.log('No active commission config found. Creating one...');
            const config = new CommissionConfig({
                name: 'Default Commission',
                companyShare: 0.10,
                distributorShare: 0.15,
                branchShare: 0.05,
                customerPointRate: 0.01,
                active: true,
                effectiveFrom: new Date()
            });
            await config.save();
            console.log('✓ Created default commission config:', config);
        }

        // Check for admin user
        const adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            console.log('ERROR: No admin user found! Please create one first.');
        } else {
            console.log('✓ Admin user exists:', adminUser.email);
        }

        // Check for products
        const productCount = await Product.countDocuments({ active: true });
        console.log(`Active products: ${productCount}`);

        if (productCount === 0 && adminUser) {
            console.log('No active products found. Creating sample products...');

            const sampleProducts = [
                {
                    name: 'Sample Product 1',
                    description: 'This is a sample product for testing',
                    basePrice: 100,
                    stock: 50,
                    active: true,
                    createdBy: adminUser._id,
                    category: 'Electronics',
                    images: ['https://via.placeholder.com/300x300?text=Product+1'],
                    tags: ['sample', 'electronics']
                },
                {
                    name: 'Sample Product 2',
                    description: 'Another sample product',
                    basePrice: 200,
                    stock: 30,
                    active: true,
                    createdBy: adminUser._id,
                    category: 'Fashion',
                    images: ['https://via.placeholder.com/300x300?text=Product+2'],
                    tags: ['sample', 'fashion']
                },
                {
                    name: 'Sample Product 3',
                    description: 'Third sample product',
                    basePrice: 150,
                    stock: 40,
                    active: true,
                    createdBy: adminUser._id,
                    category: 'Home',
                    images: ['https://via.placeholder.com/300x300?text=Product+3'],
                    tags: ['sample', 'home']
                }
            ];

            await Product.insertMany(sampleProducts);
            console.log('✓ Created 3 sample products');
        }

        console.log('\n=== Summary ===');
        console.log(`Commission configs: ${await CommissionConfig.countDocuments({ active: true })}`);
        console.log(`Products: ${await Product.countDocuments({ active: true })}`);
        console.log(`Admin users: ${await User.countDocuments({ role: 'admin' })}`);

        await mongoose.connection.close();
        console.log('\nDatabase check complete!');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAndInitialize();
