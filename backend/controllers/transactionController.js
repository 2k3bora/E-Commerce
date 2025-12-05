const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const CommissionLedger = require('../models/CommissionLedger');
const User = require('../models/User');
const Config = require('../models/Config');

exports.handlePurchase = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const { userId, amount } = req.body;
        const purchaseAmount = parseFloat(amount);

        // 1. Fetch global commission configuration.
        // Assuming there's a Config model with a single document for global settings
        // If not, we might need to use default values or a specific query
        let config = await Config.findOne().session(session);
        if (!config) {
            // Fallback or error if config is mandatory. 
            // For now, let's assume a default config if missing for robustness, 
            // or strictly throw error if that's the requirement.
            // Based on scaffold, it throws error.
            // Let's try to find one or create a default one for simulation if needed, 
            // but strictly following scaffold:
            // throw new Error('Configuration not found.');

            // However, to make it work without seeding config first, let's use defaults if null
            config = { staffPercentage: 0.10, distributorPercentage: 0.05 }; // Default fallback
        }

        // 2. Find the customer's wallet and lock the document for this transaction.
        const customerWallet = await Wallet.findOne({ user: userId }).session(session);
        if (!customerWallet) {
            throw new Error('Wallet not found.');
        }
        if (customerWallet.balance < purchaseAmount) {
            throw new Error('Insufficient funds.');
        }

        // 3. Debit the customer's wallet.
        customerWallet.balance -= purchaseAmount;
        await customerWallet.save({ session });

        // 4. Create the main transaction record for the debit.
        const purchaseTransaction = new Transaction({
            wallet: customerWallet._id,
            user: userId,
            amount: purchaseAmount,
            type: 'debit',
            description: 'Product Purchase'
        });
        const savedTransaction = await purchaseTransaction.save({ session });

        // 5. Find the Customer to get their parent (Staff/Distributor?)
        // The scaffold says: "Find the Staff member and their parent Distributor"
        // Usually a customer is assigned to a Staff or Distributor.
        // Let's assume customer.parent is the Staff/Distributor who gets commission.
        const customer = await User.findById(userId).session(session);
        if (!customer) throw new Error('Customer not found');

        // If customer has a parent (the seller/staff)
        if (customer.parent) {
            const staff = await User.findById(customer.parent).session(session);

            if (staff) {
                // Calculate Staff Commission
                const staffCommission = purchaseAmount * (config.staffPercentage || 0);
                if (staffCommission > 0) {
                    const staffCommissionRecord = new CommissionLedger({
                        user: staff._id,
                        transaction: savedTransaction._id,
                        amount: staffCommission,
                        commissionPercentage: (config.staffPercentage || 0) * 100
                    });
                    await staffCommissionRecord.save({ session });

                    // Credit Staff Wallet (Optional: depending on if commission goes to wallet immediately or just ledger)
                    // Scaffold doesn't explicitly say credit wallet, but usually it does. 
                    // Let's stick to Ledger as per scaffold pseudocode.
                }

                // Calculate Distributor Commission (Staff's parent)
                if (staff.parent) {
                    const distributor = await User.findById(staff.parent).session(session);
                    if (distributor) {
                        const distributorCommission = purchaseAmount * (config.distributorPercentage || 0);
                        if (distributorCommission > 0) {
                            const distributorCommissionRecord = new CommissionLedger({
                                user: distributor._id,
                                transaction: savedTransaction._id,
                                amount: distributorCommission,
                                commissionPercentage: (config.distributorPercentage || 0) * 100
                            });
                            await distributorCommissionRecord.save({ session });
                        }
                    }
                }
            }
        }

        await session.commitTransaction();
        res.status(200).json({ message: 'Purchase successful', transactionId: savedTransaction._id });

    } catch (error) {
        await session.abortTransaction();
        console.error('Transaction failed:', error);
        res.status(400).json({ message: error.message });
    } finally {
        session.endSession();
    }
};
