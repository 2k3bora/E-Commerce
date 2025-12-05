const express = require('express'); // Force restart debug 3
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const path = require('path');

// Load environment variables from .env file (ensure path is backend/.env regardless of cwd)
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// When running behind a proxy (CRA dev server or reverse proxy), enable trust proxy so rate-limit
// and IP detection work correctly. Use a restrictive value in development to avoid permissive trust.
// 'loopback' restricts trust to loopback addresses (127.0.0.1, ::1) which is appropriate for local dev.
app.set('trust proxy', 'loopback');

const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// --- Security Middleware ---
app.use(helmet()); // Helps secure Express apps by setting various HTTP headers
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json({ limit: '50mb' })); // Body parser for JSON format (limit body size)

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Rate Limiting to prevent brute-force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log('MongoDB Connected');
    // Seed default admin user if configured
    try {
      // Check if default admin creation is disabled (e.g. after migration)
      if (!process.env.DISABLE_DEFAULT_ADMIN) {
        const User = require('./models/User');
        const bcrypt = require('bcryptjs');
        const defaultAdminEmail = (process.env.DEFAULT_ADMIN_EMAIL || process.env.DEFAULT_ADMIN || 'admin@abc.com').toLowerCase();
        const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin@123';
        const defaultAdminName = process.env.DEFAULT_ADMIN_NAME || 'Administrator';
        if (defaultAdminEmail) {
          const existing = await User.findOne({ email: defaultAdminEmail.toLowerCase() });
          if (!existing) {
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(defaultAdminPassword, salt);
            const u = new User({
              username: defaultAdminEmail.split('@')[0],
              email: defaultAdminEmail.toLowerCase(),
              name: defaultAdminName,
              password: hashed,
              role: 'admin',
              status: 'active',
              authProvider: 'local',
              mustChangePassword: true
            });
            await u.save();
            console.log('Default admin user created (email/password):', defaultAdminEmail);
          } else {
            // ensure role is admin
            if (existing.role !== 'admin') {
              existing.role = 'admin';
              existing.status = 'active';
              // also ensure a password exists for admin if none is present
              if (!existing.password) {
                const salt = await bcrypt.genSalt(10);
                existing.password = await bcrypt.hash(defaultAdminPassword, salt);
                existing.mustChangePassword = true;
              }
              await existing.save();
              console.log('Default admin user updated to admin role (password ensured):', defaultAdminEmail);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error seeding default admin:', err);
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

// --- API Routes ---
app.use('/api/auth', require('./routes/auth'));
// New routes for products/pricing, payments (webhook) and orders
app.use('/api/products', require('./routes/products'));
app.use('/api/payment', require('./routes/payments'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/order', require('./routes/orders'));
app.use('/api/app', require('./routes/appConfig'));
// Admin routes (create distributors, manage users)
app.use('/api/admin', require('./routes/admin'));
// Distributor self-service routes
app.use('/api/distributor', require('./routes/distributor'));
// Products CRUD
// app.use('/api/products', require('./routes/products')); // Duplicate removed
// Customers management
app.use('/api/customers', require('./routes/customers'));
app.use('/api/commissions', require('./routes/commissions'));
// Review and Wishlist routes
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/wishlist', require('./routes/wishlist'));

// Transaction Routes (Purchase Logic)
// app.use('/api', require('./routes/transactionRoutes'));

// --- Static File Serving for Production ---
if (process.env.NODE_ENV === 'production') {
  // Serve the static files from the React app
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  // Handles any requests that don't match the ones above
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// --- Server Initialization ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
