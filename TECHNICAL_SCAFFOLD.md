# Technical Scaffold: Multi-Level Sales and Distribution Management App

## 1. Project File Structure

### Backend (Node.js / Express)

```
backend/
├── config/
│   └── db.js             # MongoDB connection setup
├── controllers/
│   ├── authController.js   # Handles user registration, login
│   ├── userController.js   # User management (CRUD)
│   ├── walletController.js # Wallet funding and balance checks
│   └── transactionController.js # Purchase handling, commission logic
├── middleware/
│   ├── authMiddleware.js   # JWT verification and role checks (RBAC)
│   └── errorMiddleware.js  # Centralized error handling
├── models/
│   ├── User.js             # User schema (Company, Distributor, Staff, Customer)
│   ├── Wallet.js           # User wallet schema
│   ├── Transaction.js      # Wallet transaction log schema
│   ├── CommissionLedger.js # Commission tracking schema
│   └── Config.js           # Global settings schema (e.g., commission rates)
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── walletRoutes.js
│   └── transactionRoutes.js
├── .env                    # Environment variables (DB_URI, JWT_SECRET)
├── server.js               # Express server entry point
└── package.json
```

### Frontend (React PWA)

```
frontend/
├── public/
│   ├── index.html
│   ├── manifest.json       # PWA manifest
│   └── icons/
├── src/
│   ├── assets/
│   │   └── images/
│   ├── components/         # Reusable UI components (Button, Input, etc.)
│   │   ├── common/
│   │   └── layout/         # (Header, Footer, Sidebar)
│   ├── contexts/           # React Context for state management (e.g., AuthContext)
│   ├── hooks/              # Custom hooks (e.g., useAuth)
│   ├── pages/              # Page components corresponding to routes
│   │   ├── AdminDashboard.js
│   │   ├── DistributorDashboard.js
│   │   ├── StaffDashboard.js
│   │   ├── CustomerDashboard.js
│   │   └── Login.js
│   ├── services/
│   │   ├── api.js          # Axios or Fetch instance for API calls
│   │   └── authService.js  # Authentication related API calls
│   ├── App.js
│   ├── index.js
│   └── service-worker.js   # PWA service worker
├── .env
└── package.json
```

## 2. API Endpoint Definitions

| Method | URL Path                                | Required Role | Description                                                                 |
|--------|-----------------------------------------|---------------|-----------------------------------------------------------------------------|
| POST   | /api/auth/register                      | Company       | Register a new user (Distributor, Staff, or Customer).                      |
| POST   | /api/auth/login                         | (Public)      | Authenticate a user and return a JWT.                                       |
| GET    | /api/users/me                           | (Authenticated) | Get the profile of the currently logged-in user.                            |
| PUT    | /api/config                             | Company       | Update global settings like commission percentages.                         |
| GET    | /api/wallet                             | Customer      | Get the current user's wallet balance.                                      |
| POST   | /api/purchase                           | Staff         | Create a purchase for a customer, debit wallet, and trigger commissions.    |
| GET    | /api/transactions                       | (Authenticated) | Get a list of transactions for the logged-in user.                          |
| GET    | /api/commissions                        | Staff, Distributor | Get a list of commissions earned by the logged-in user.                  |
| GET    | /api/admin/dashboard                    | Company       | Fetch all transaction and commission data for analytics.                    |
| GET    | /api/distributor/staff                  | Distributor   | Get a list of all Staff managed by the logged-in Distributor.               |

## 3. Core Logic (Pseudocode) for `handlePurchase`

This function demonstrates the critical ACID transaction for a customer purchase.

```javascript
const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const CommissionLedger = require('../models/CommissionLedger');
const User = require('../models/User');
const Config = require('../models/Config');

async function handlePurchase(customerId, staffId, purchaseAmount) {
    // A MongoDB client session is required for ACID transactions.
    // This would typically be initiated in the controller and passed down.
    const session = await mongoose.startSession();

    try {
        // 1. Start the ACID transaction.
        session.startTransaction();

        // 2. Fetch global commission configuration.
        const config = await Config.findOne().session(session);
        if (!config) {
            throw new Error('Configuration not found.');
        }

        // 3. Find the customer's wallet and lock the document for this transaction.
        const customerWallet = await Wallet.findOne({ user: customerId }).session(session);
        if (!customerWallet || customerWallet.balance < purchaseAmount) {
            throw new Error('Insufficient funds or wallet not found.');
        }

        // 4. Debit the customer's wallet.
        customerWallet.balance -= purchaseAmount;
        await customerWallet.save({ session });

        // 5. Create the main transaction record for the debit.
        const purchaseTransaction = new Transaction({
            wallet: customerWallet._id,
            user: customerId,
            amount: purchaseAmount,
            type: 'debit',
            description: 'Product Purchase'
        });
        const savedTransaction = await purchaseTransaction.save({ session });

        // 6. Find the Staff member and their parent Distributor to calculate commissions.
        const staff = await User.findById(staffId).session(session);
        if (!staff || !staff.parent) {
            throw new Error('Staff or their parent Distributor not found.');
        }
        const distributorId = staff.parent;

        // 7. Calculate and record the Staff's commission.
        const staffCommission = purchaseAmount * config.staffPercentage;
        const staffCommissionRecord = new CommissionLedger({
            user: staffId,
            transaction: savedTransaction._id,
            amount: staffCommission,
            commissionPercentage: config.staffPercentage
        });
        await staffCommissionRecord.save({ session });

        // 8. Calculate and record the Distributor's commission.
        const distributorCommission = purchaseAmount * config.distributorPercentage;
        const distributorCommissionRecord = new CommissionLedger({
            user: distributorId,
            transaction: savedTransaction._id,
            amount: distributorCommission,
            commissionPercentage: config.distributorPercentage
        });
        await distributorCommissionRecord.save({ session });

        // 9. If all operations succeed, commit the transaction.
        await session.commitTransaction();
        console.log('Purchase successful and commissions distributed.');

    } catch (error) {
        // 10. If any operation fails, abort the entire transaction.
        console.error('Transaction failed. Aborting.', error.message);
        await session.abortTransaction();
        // Re-throw the error to be handled by a global error handler
        throw error;

    } finally {
        // 11. Always end the session.
        session.endSession();
    }
}
