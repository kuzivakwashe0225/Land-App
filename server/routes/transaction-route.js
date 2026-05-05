import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import Transaction from '../models/transactionModel.js';
import Land from '../models/landModel.js';
import { errorHandler } from '../utils/error.js';

const router = express.Router();

// Initiate a "Request to Buy"
router.post('/request', verifyToken, async (req, res, next) => {
    try {
        const { landId, offerPrice, message } = req.body;

        if (!landId || !offerPrice) {
            return next(errorHandler(400, "Land ID and offer price are required"));
        }

        const land = await Land.findById(landId);
        if (!land) return next(errorHandler(404, "Land not found"));

        if (land.owner.toString() === req.user.id) {
            return next(errorHandler(400, "You cannot buy your own property"));
        }

        // Check if property is verified
        if (!['VERIFIED', 'AUTO_VERIFIED'].includes(land.verification.status)) {
            return next(errorHandler(403, "This property is not yet verified for sale"));
        }

        // Create a new transaction record
        const newTransaction = new Transaction({
            land: landId,
            buyer: req.user.id,
            seller: land.owner,
            transactionDetails: {
                type: 'SALE',
                status: 'INITIATED',
                offerPrice: {
                    amount: offerPrice,
                    currency: 'USD'
                },
                negotiationHistory: [{
                    price: { amount: offerPrice, currency: 'USD' },
                    proposedBy: req.user.id,
                    message: message || "I am interested in this property."
                }]
            }
        });

        await newTransaction.save();

        res.status(201).json({
            success: true,
            message: "Purchase request sent successfully!",
            data: newTransaction
        });
    } catch (error) {
        next(error);
    }
});

// Get user's transactions (buying or selling)
router.get('/my-transactions', verifyToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const transactions = await Transaction.find({
            $or: [{ buyer: userId }, { seller: userId }]
        })
            .populate('land', 'standNumber location')
            .populate('buyer', 'firstName lastName')
            .populate('seller', 'firstName lastName')
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            data: transactions
        });
    } catch (error) {
        next(error);
    }
});

// Update transaction status (Seller accept/reject)
router.post('/:txnId/status', verifyToken, async (req, res, next) => {
    try {
        const { status, message } = req.body;
        const txn = await Transaction.findById(req.params.txnId);

        if (!txn) return next(errorHandler(404, "Transaction not found"));

        // Check permissions (only seller can accept/reject initial request)
        if (txn.seller.toString() !== req.user.id) {
            return next(errorHandler(403, "You are not authorized to update this transaction"));
        }

        txn.transactionDetails.status = status;
        txn.transactionDetails.negotiationHistory.push({
            proposedBy: req.user.id,
            status: status === 'PENDING_VERIFICATION' ? 'ACCEPTED' : 'REJECTED',
            message
        });

        await txn.save();

        res.status(200).json({
            success: true,
            message: `Transaction ${status.toLowerCase()}ed`,
            data: txn
        });
    } catch (error) {
        next(error);
    }
});

export default router;
