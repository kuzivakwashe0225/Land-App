import mongoose from 'mongoose';

const landSchema = new mongoose.Schema({
  standNumber: {
    type: String,
    required: [true, 'Stand number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  titleDeedNumber: {
    type: String,
    required: [true, 'Title deed number is required'],
    unique: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    address: {
      street: String,
      suburb: {
        type: String,
        required: true,
        enum: ['HARARE', 'CHITUNGWIZA', 'KADOMA', 'BULAWAYO', 'GWERU', 'MASVINGO', 'MUTARE']
      },
      province: {
        type: String,
        required: true,
        default: 'HARARE'
      }
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    boundaries: [{
      latitude: Number,
      longitude: Number
    }]
  },
  landDetails: {
    size: {
      squareMeters: {
        type: Number,
        required: true
      },
      hectares: {
        type: Number,
        required: true
      }
    },
    zoning: {
      type: String,
      required: true,
      enum: ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL', 'MIXED_USE']
    },
    landUse: {
      type: String,
      required: true,
      enum: ['VACANT', 'DEVELOPED', 'PARTIALLY_DEVELOPED']
    }
  },
  images: [{
    type: String
  }],
  listingStatus: {
    type: String,
    enum: ['draft', 'pending_verification', 'verified', 'rejected', 'sold', 'withdrawn'],
    default: 'draft'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  soldAt: Date,
  withdrawnAt: Date,
  version: {
    type: Number,
    default: 1
  },
  parentListingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Land'
  },
  verification: {
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'SUSPENDED', 'SUSPICIOUS'],
      default: 'DRAFT'
    },
    isVerified: { type: Boolean, default: false },
    authorityVerified: { type: Boolean, default: false }, // Direct match with municipality records
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verificationDate: Date,
    deedsOfficeVerified: { type: Boolean, default: false },
    municipalVerified: { type: Boolean, default: false },
    rejectionReason: String,
    adminNotes: String,
    verificationDocuments: [{
      documentType: {
        type: String,
        enum: ['TITLE_DEED', 'SURVEY_PLAN', 'RATES_CLEARANCE', 'ZONING_CERTIFICATE', 'COUNCIL_CESSION']
      },
      documentUrl: String,
      uploadedAt: { type: Date, default: Date.now }
    }],

    // ── Automated Verification Intelligence (Phase 1 & 2) ────────────────
    autoVerification: {
      ranAt: Date,
      verificationScore: { type: Number, min: 0, max: 100 },  // 0-100 = verification confidence
      riskScore: { type: Number, min: 0, max: 100 },  // 0 = safe, 100 = high risk (100 - verificationScore)
      decision: {
        type: String,
        enum: ['AUTO_APPROVE', 'HUMAN_REVIEW', 'AUTO_REJECT']
      },
      reason: String,  // Reason for auto-rejection (e.g., "Duplicate stand number" or "Score below 70%")
      isDuplicateRejection: { type: Boolean, default: false },  // True if rejected for being a duplicate
      flags: [String],   // e.g. ['NAME_MISMATCH', 'DOCUMENT_POSSIBLY_TAMPERED', 'DUPLICATE']
      signals: {
        // OCR + name match
        nameMatchConfidence: Number,   // 0.0 – 1.0
        nameMatched: Boolean,
        ocrExtractedNames: [String],
        standNumberOcrMatch: Boolean,
        // Tamper detection
        elaScore: Number,              // 0 = clean, 100 = likely tampered
        documentTampered: Boolean,
        // Document hashes
        documentSha256: String,
        documentPHash: String,
        isDuplicateDocument: Boolean,
        duplicateType: String,         // 'EXACT' | 'PERCEPTUAL'
        // GPS proof
        gpsProofSubmitted: Boolean,
        gpsProofValid: Boolean,
        gpsDistanceMeters: Number,
        // Coordinate checks
        coordinatesInSuburb: Boolean,
        geocodedToZimbabwe: Boolean,
        geocodeCity: String,
      }
    },

    // Legacy verification result fields (kept for compatibility)
    verificationResult: {
      verificationId: String,
      authenticationScore: Number,
      isAuthentic: Boolean,
      checks: mongoose.Schema.Types.Mixed,
      flags: [String],
      warnings: [String],
      timestamp: Date,
    }
  },
  transaction: {
    status: {
      type: String,
      enum: ['AVAILABLE', 'PENDING_SALE', 'SOLD', 'UNDER_REVIEW', 'FLAGGED', 'REJECTED'],
      default: 'AVAILABLE'
    },
    listedPrice: {
      amount: {
        type: Number,
        required: true
      },
      currency: {
        type: String,
        default: 'USD'
      }
    },
    transactionHistory: [{
      transactionType: {
        type: String,
        enum: ['LISTING', 'OFFER', 'SALE', 'TRANSFER']
      },
      date: {
        type: Date,
        default: Date.now
      },
      buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      amount: Number,
      status: String
    }]
  },
  // ── GPS Proof-of-Presence ─────────────────────────────────────────────────
  gpsProof: {
    submittedAt: Date,
    latitude: Number,
    longitude: Number,
    accuracy: Number,      // meters, from browser GPS
    photoUrl: String,      // selfie-at-location photo
    distanceFromListing: Number, // computed meters
    valid: Boolean
  },

  fraudFlags: [{
    flagType: {
      type: String,
      enum: ['DUPLICATE_LISTING', 'OWNERSHIP_DISPUTE', 'FAKE_DOCUMENTS', 'SUSPICIOUS_ACTIVITY']
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reportedAt: {
      type: Date,
      default: Date.now
    },
    description: String,
    evidence: {
      type: String,
      maxlength: 1000
    },
    triggeredBySystem: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['PENDING', 'UNDER_INVESTIGATION', 'RESOLVED', 'FALSE_ALARM'],
      default: 'PENDING'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient searching
landSchema.index({ standNumber: 1 });
landSchema.index({ titleDeedNumber: 1 });
landSchema.index({ 'location.address.suburb': 1 });
landSchema.index({ owner: 1 });
landSchema.index({ 'transaction.status': 1 });
landSchema.index({ 'verification.isVerified': 1 });
landSchema.index({ listingStatus: 1 });
landSchema.index({ isActive: 1 });
landSchema.index({ parentListingId: 1 });
landSchema.index({ 'location.coordinates': '2dsphere' }); // For geospatial queries

// Middleware to update the updatedAt field on save
landSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Land = mongoose.model('Land', landSchema);

export default Land;
