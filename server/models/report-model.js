import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Land',
        required: true
    },
    reason: {
        type: String,
        enum: ['FRAUDULENT_LISTING', 'INCORRECT_INFORMATION', 'OWNERSHIP_DISPUTE', 'DUPLICATE_LISTING', 'OTHER'],
        required: true
    },
    details: {
        type: String,
        required: true,
        maxlength: 1000
    },
    status: {
        type: String,
        enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'],
        default: 'OPEN'
    },
    adminNotes: String,
}, {
    timestamps: true
});

reportSchema.index({ reporter: 1 });
reportSchema.index({ listing: 1 });
reportSchema.index({ status: 1 });

const Report = mongoose.model('Report', reportSchema);

export default Report;
