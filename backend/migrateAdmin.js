const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

const targetEmail = process.argv[2];

if (!targetEmail) {
    console.error('Usage: node backend/migrateAdmin.js <your-google-email>');
    process.exit(1);
}

async function migrateAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');

        const normalizedEmail = targetEmail.toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            console.error(`User with email ${normalizedEmail} not found.`);
            console.error('Please login with your Google account first to create the user record.');
            process.exit(1);
        }

        console.log(`Found user: ${user.name} (${user.email})`);
        console.log(`Current Role: ${user.role}`);

        // Promote to admin
        user.role = 'admin';
        user.status = 'active';
        await user.save();
        console.log(`SUCCESS: ${user.email} is now an ADMIN.`);

        // Disable/Delete default admin
        const defaultAdminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@abc.com').toLowerCase();

        if (defaultAdminEmail === normalizedEmail) {
            console.log('Target email is same as default admin email. Skipping deletion.');
        } else {
            const defaultAdmin = await User.findOne({ email: defaultAdminEmail });
            if (defaultAdmin) {
                // Option 1: Delete
                await User.deleteOne({ _id: defaultAdmin._id });
                console.log(`Deleted default admin account: ${defaultAdminEmail}`);

                // Option 2: Disable (if you prefer)
                // defaultAdmin.status = 'inactive';
                // defaultAdmin.role = 'customer';
                // await defaultAdmin.save();
            } else {
                console.log(`Default admin ${defaultAdminEmail} not found (already deleted?).`);
            }
        }

        console.log('---------------------------------------------------');
        console.log('MIGRATION COMPLETE');
        console.log('1. Your Google account is now the Admin.');
        console.log('2. The default admin account has been removed.');
        console.log('3. To prevent the default admin from being recreated, add this to your backend/.env file:');
        console.log('   DISABLE_DEFAULT_ADMIN=true');
        console.log('---------------------------------------------------');

        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrateAdmin();
