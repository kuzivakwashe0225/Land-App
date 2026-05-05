import mongoose from 'mongoose';

const standsSchema = new mongoose.Schema({
  // Stand Identification
  standNumber: {
    type: String,
    required: [true, 'Stand number is required'],
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },

  // Location & Coordinates
  suburb: {
    type: String,
    required: true,
    enum: ['HARARE', 'CHITUNGWIZA', 'KADOMA', 'BULAWAYO', 'GWERU', 'MASVINGO', 'MUTARE'],
    index: true
  },
  coordinates: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },

  // Stand Details
  size: {
    squareMeters: {
      type: Number,
      required: true,
      min: 1
    },
    hectares: {
      type: Number,
      required: true
    }
  },

  // Zoning & Usage
  zoning: {
    type: String,
    enum: ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL', 'MIXED_USE'],
    required: true,
    index: true
  },
  intendedUse: {
    type: String,
    enum: ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL', 'MIXED_USE'],
    required: true
  },

  // Stand Status
  status: {
    type: String,
    enum: ['VACANT', 'ALLOCATED', 'DISPUTED', 'UNDER_INVESTIGATION', 'SOLD'],
    default: 'VACANT',
    index: true
  },

  // Authority Information
  authority: {
    authorityName: {
      type: String,
      default: 'Harare City Council'
    },
    approvalDate: Date,
    approvalReference: String,
    allocationType: {
      type: String,
      enum: ['GOVERNMENT', 'LOCAL_AUTHORITY', 'PRIVATE_LAND', 'COMMUNAL'],
      default: 'LOCAL_AUTHORITY'
    }
  },

  // Ownership Information (if allocated)
  allocation: {
    allocatedTo: String,
    nationalId: String,
    allocationDate: Date,
    allocationReference: String,
    isDisputedOwnership: {
      type: Boolean,
      default: false
    }
  },

  // Regulatory Compliance
  compliance: {
    plotRatioApproved: Boolean,
    buildingHeightLimitMeters: Number,
    setbackRequirements: {
      frontSetbackMeters: Number,
      sideSetbackMeters: Number,
      rearSetbackMeters: Number
    },
    hasEIA: { // Environmental Impact Assessment
      type: Boolean,
      default: false
    },
    hasFloodRisk: {
      type: Boolean,
      default: false
    },
    restrictions: [String] // e.g., "No commercial activities", "Residential only"
  },

  // Verification Status
  verificationStatus: {
    isVerified: {
      type: Boolean,
      default: true
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationDate: Date,
    flagsCount: {
      type: Number,
      default: 0
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },

  // Documents & Records
  documents: {
    surveyPlan: String,
    titleDeed: String,
    zoningCertificate: String,
    approvalLetter: String
  },

  // History Tracking
  history: [{
    action: String,
    date: { type: Date, default: Date.now },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    details: mongoose.Schema.Types.Mixed
  }],

  // Metadata
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

// Indexes for performance
standsSchema.index({ standNumber: 1, suburb: 1 });
standsSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });
standsSchema.index({ suburb: 1, status: 1 });
standsSchema.index({ zoning: 1, status: 1 });
standsSchema.index({ 'allocation.allocatedTo': 1 });

// Pre-save middleware to calculate hectares
standsSchema.pre('save', function(next) {
  if (this.size && this.size.squareMeters) {
    this.size.hectares = this.size.squareMeters / 10000;
  }
  next();
});

const Stands = mongoose.model('Stands', standsSchema);

export default Stands;
