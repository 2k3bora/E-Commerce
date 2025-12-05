const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');
        const users = await User.find({ username: { $exists: false } });
        console.log(`Found ${users.length} users without username`);

        for (const u of users) {
            u.username = u.email;
            // We use updateOne to bypass validation if other fields are invalid, 
            // but save() is better to ensure validity. 
            // If save() fails, we'll log it.
            try {
                await u.save();
                console.log(`Updated ${u.email}`);
            } catch (e) {
                console.error(`Failed to update ${u.email}:`, e.message);
                // Try direct update
                await User.updateOne({ _id: u._id }, { $set: { username: u.email } });
                console.log(`Force updated ${u.email}`);
            }
        }

        console.log('Migration done');
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
