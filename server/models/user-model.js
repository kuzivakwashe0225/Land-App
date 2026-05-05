import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters long'],
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters long'],
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^(\+263|0)[0-9]{9}$/, 'Phone must be +263xxxxxxxxx or 0xxxxxxxxx (11 digits total)']
  },
  nationalId: {
    type: String,
    required: [true, 'National ID is required'],
    unique: true,
    match: [/^[0-9]{2}-[0-9]{7}[A-Z][0-9]{2}$/, 'National ID format: XX-XXXXXXXAXX (e.g., 63-2456789Z45)']
  },
  role: {
    type: String,
    enum: ['BUYER', 'SELLER', 'MUNICIPAL_OFFICER', 'SYSTEM_ADMIN', 'VERIFICATION_OFFICER'],
    default: 'BUYER'
  },
  verification: {
    kycStatus: {
      type: String,
      enum: ['NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'NOT_SUBMITTED'
    },
    sellerDetailsApproved: {
      type: Boolean,
      default: false
    },
    sellerDetailsSubmittedAt: Date,
    sellerDetailsApprovedAt: Date,
    isVerified: {
      type: Boolean,
      default: false
    },
    kycDocs: [{
      documentType: {
        type: String,
        enum: ['NATIONAL_ID', 'PROOF_OF_ADDRESS', 'SELFIE', 'ID_WITH_SELFIE']
      },
      documentUrl: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
      }
    }],
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationDate: Date
  },
  authentication: {
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long']
    },
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: String
  },
  profile: {
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER']
    },
    occupation: String,
    residentialAddress: {
      street: String,
      suburb: String,
      city: String,
      province: String,
      postalCode: String
    },
    profilePicture: String,
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    }
  },
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    language: {
      type: String,
      enum: ['ENGLISH', 'SHONA', 'NDEBELE'],
      default: 'ENGLISH'
    },
    currency: {
      type: String,
      enum: ['USD', 'ZWL'],
      default: 'USD'
    }
  },
  activity: {
    lastActive: {
      type: Date,
      default: Date.now
    },
    totalTransactions: {
      type: Number,
      default: 0
    },
    successfulTransactions: {
      type: Number,
      default: 0
    },
    accountStatus: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'DEACTIVATED', 'BANNED'],
      default: 'ACTIVE'
    }
  },
  security: {
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    lastPasswordChange: Date,
    securityQuestions: [{
      question: String,
      answer: String
    }]
  },
  flagging: {
    totalSubmitted: {
      type: Number,
      default: 0
    },
    falseFlagCount: {
      type: Number,
      default: 0
    },
    strikeCount: {
      type: Number,
      default: 0
    },
    bannedUntil: Date,
    permanentBan: {
      type: Boolean,
      default: false
    },
    flagHistory: [{
      landId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Land'
      },
      flaggedAt: {
        type: Date,
        default: Date.now
      },
      resolution: {
        type: String,
        enum: ['PENDING', 'VALID', 'FALSE_ALARM'],
        default: 'PENDING'
      }
    }]
  }
}, {
  timestamps: true
});

// Index for efficient searching
userSchema.index({ email: 1 });
userSchema.index({ nationalId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'verification.isVerified': 1 });
userSchema.index({ 'activity.accountStatus': 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Middleware to update last activity
userSchema.pre('save', function (next) {
  if (this.isModified() && !this.isNew) {
    this.activity.lastActive = new Date();
  }
  next();
});

// Method to check if account is locked
userSchema.virtual('isLocked').get(function () {
  return !!(this.authentication.lockUntil && this.authentication.lockUntil > Date.now());
});

const User = mongoose.model('User', userSchema);

export default User;
