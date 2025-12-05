const mongoose = require('mongoose');
const AppConfig = require('./models/AppConfig');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');
        const cfg = await AppConfig.findOne().sort({ createdAt: -1 }).lean();
        console.log('Latest Config:', cfg);
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
