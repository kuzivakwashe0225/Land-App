import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: false // Messages can be standalone or tied to a txn
    },
    land: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Land',
        required: false
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    readAt: {
        type: Date,
        default: null
    },
    isSystemGenerated: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Message = mongoose.model('Message', messageSchema);

export default Message;
