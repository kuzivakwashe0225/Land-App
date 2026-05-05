import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }
  },
  land: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Land',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transactionDetails: {
    type: {
      type: String,
      enum: ['SALE', 'TRANSFER', 'LEASE', 'GIFT'],
      required: true
    },
    status: {
      type: String,
      enum: ['INITIATED', 'PENDING_VERIFICATION', 'MUNICIPAL_APPROVAL', 'PAYMENT_PENDING', 'COMPLETED', 'CANCELLED', 'FLAGGED'],
      default: 'INITIATED'
    },
    offerPrice: {
      amount: {
        type: Number,
        required: true
      },
      currency: {
        type: String,
        default: 'USD'
      }
    },
    finalPrice: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD'
      }
    },
    negotiationHistory: [{
      price: {
        amount: Number,
        currency: String
      },
      proposedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      proposedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['PROPOSED', 'ACCEPTED', 'REJECTED', 'COUNTERED'],
        default: 'PROPOSED'
      },
      message: String
    }]
  },
  verification: {
    buyerVerification: {
      status: {
        type: String,
        enum: ['PENDING', 'VERIFIED', 'REJECTED'],
        default: 'PENDING'
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      verificationDate: Date,
      documents: [{
        type: String,
        url: String,
        uploadedAt: Date
      }]
    },
    sellerVerification: {
      status: {
        type: String,
        enum: ['PENDING', 'VERIFIED', 'REJECTED'],
        default: 'PENDING'
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      verificationDate: Date,
      documents: [{
        type: String,
        url: String,
        uploadedAt: Date
      }]
    },
    landVerification: {
      status: {
        type: String,
        enum: ['PENDING', 'VERIFIED', 'REJECTED'],
        default: 'PENDING'
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      verificationDate: Date,
      deedsOfficeCheck: {
        status: {
          type: String,
          enum: ['PENDING', 'CLEARED', 'FLAGGED'],
          default: 'PENDING'
        },
        checkedAt: Date,
        checkedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        flags: [String]
      },
      municipalCheck: {
        status: {
          type: String,
          enum: ['PENDING', 'CLEARED', 'FLAGGED'],
          default: 'PENDING'
        },
        checkedAt: Date,
        checkedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        flags: [String]
      }
    }
  },
  payment: {
    status: {
      type: String,
      enum: ['PENDING', 'PARTIAL', 'COMPLETED', 'FAILED'],
      default: 'PENDING'
    },
    method: {
      type: String,
      enum: ['BANK_TRANSFER', 'CASH', 'MOBILE_MONEY', 'ESCROW'],
      // Not required at initiation — buyer selects payment method later in negotiation
      default: 'BANK_TRANSFER'
    },
    amountPaid: {
      type: Number,
      default: 0
    },
    paymentSchedule: [{
      installmentNumber: Number,
      dueDate: Date,
      amount: Number,
      status: {
        type: String,
        enum: ['PENDING', 'PAID', 'OVERDUE'],
        default: 'PENDING'
      },
      paidAt: Date,
      paymentReference: String
    }],
    escrowDetails: {
      escrowAgent: String,
      releaseConditions: [String],
      releaseDate: Date
    }
  },
  documentation: {
    agreementOfSale: {
      url: String,
      uploadedAt: Date,
      signedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    },
    titleDeedTransfer: {
      url: String,
      uploadedAt: Date,
      transferNumber: String,
      registeredAt: Date
    },
    municipalClearance: {
      url: String,
      uploadedAt: Date,
      clearanceNumber: String,
      issuedAt: Date
    },
    additionalDocuments: [{
      documentType: String,
      url: String,
      uploadedAt: Date,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },
  fraudFlags: [{
    flagType: {
      type: String,
      enum: ['OWNERSHIP_DISPUTE', 'DOCUMENT_FORGERY', 'PRICE_MANIPULATION', 'MULTIPLE_LISTINGS', 'SUSPICIOUS_TIMING']
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reportedAt: {
      type: Date,
      default: Date.now
    },
    description: String,
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM'
    },
    status: {
      type: String,
      enum: ['PENDING', 'UNDER_INVESTIGATION', 'RESOLVED', 'FALSE_ALARM'],
      default: 'PENDING'
    },
    investigatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolution: String
  }],
  timeline: [{
    action: {
      type: String,
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    description: String,
    documents: [String]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
}, {
  timestamps: true
});

// Index for efficient searching
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ buyer: 1 });
transactionSchema.index({ seller: 1 });
transactionSchema.index({ land: 1 });
transactionSchema.index({ 'transactionDetails.status': 1 });
transactionSchema.index({ 'verification.landVerification.status': 1 });
transactionSchema.index({ 'payment.status': 1 });

// Middleware to update timeline on status change
transactionSchema.pre('save', function(next) {
  if (this.isModified('transactionDetails.status') && !this.isNew) {
    this.timeline.push({
      action: 'STATUS_UPDATE',
      performedBy: this.buyer, // Buyer ID is always available
      description: `Transaction status updated to ${this.transactionDetails.status}`
    });
  }
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
