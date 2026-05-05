import express from 'express';
import mongoose from 'mongoose';
import { verifyToken } from '../utils/verifyUser.js';
import Message from '../models/message-model.js';
import { errorHandler } from '../utils/error.js';

const router = express.Router();

// Send a message
router.post('/send', verifyToken, async (req, res, next) => {
    try {
        const { recipient, content, transaction, land } = req.body;

        if (!recipient || !content) {
            return next(errorHandler(400, "Recipient and content are required"));
        }

        const newMessage = new Message({
            sender: req.user.id,
            recipient,
            content,
            transaction,
            land
        });

        await newMessage.save();

        res.status(201).json({
            success: true,
            data: newMessage
        });
    } catch (error) {
        next(error);
    }
});

// Get conversations for the current user
router.get('/conversations', verifyToken, async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Aggregate to get unique conversation partners
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [{ sender: new mongoose.Types.ObjectId(userId) }, { recipient: new mongoose.Types.ObjectId(userId) }]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
                            "$recipient",
                            "$sender"
                        ]
                    },
                    lastMessage: { $first: "$content" },
                    lastTimestamp: { $first: "$createdAt" },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$recipient", new mongoose.Types.ObjectId(userId)] },
                                        { $eq: ["$readAt", null] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $unwind: '$userDetails'
            },
            {
                $project: {
                    partnerId: '$_id',
                    lastMessage: 1,
                    lastTimestamp: 1,
                    unreadCount: 1,
                    partnerName: { $concat: ['$userDetails.firstName', ' ', '$userDetails.lastName'] },
                    partnerAvatar: '$userDetails.profile.profilePicture'
                }
            },
            {
                $sort: { lastTimestamp: -1 }
            }
        ]);

        res.status(200).json({
            success: true,
            data: conversations
        });
    } catch (error) {
        next(error);
    }
});

// Get messages for a specific conversation
router.get('/:partnerId', verifyToken, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const partnerId = req.params.partnerId;

        const messages = await Message.find({
            $or: [
                { sender: userId, recipient: partnerId },
                { sender: partnerId, recipient: userId }
            ]
        }).sort({ createdAt: 1 });

        // Mark as read
        await Message.updateMany(
            { sender: partnerId, recipient: userId, readAt: null },
            { $set: { readAt: new Date() } }
        );

        res.status(200).json({
            success: true,
            data: messages
        });
    } catch (error) {
        next(error);
    }
});

export default router;
