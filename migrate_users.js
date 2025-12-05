const mongoose = require('mongoose');
const User = require('./backend/models/User');
require('dotenv').config({ path: './backend/.env' });

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');
        const users = await User.find({ username: { $exists: false } });
        console.log(`Found ${users.length} users without username`);

        for (const u of users) {
            u.username = u.email;
            await u.save();
            console.log(`Updated ${u.email}`);
        }

        console.log('Migration done');
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
