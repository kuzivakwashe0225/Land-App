import mongoose from 'mongoose';

/**
 * AuthorityRecords Model
 *
 * Simulates the Zimbabwe Deeds Office / Municipal Authority database.
 * Used to verify that a listed stand genuinely exists, is correctly zoned,
 * has no disputes or encumbrances, and has cleared rates.
 *
 * IMPORTANT: This model does NOT verify that the seller owns the stand.
 * Seller identity is verified separately via KYC (ID doc + selfie).
 * A stand may be council-owned, developer-owned, or have no previous owner.
 */
const authorityRecordsSchema = new mongoose.Schema({
  // ── Stand Identity ─────────────────────────────────────────────────────────
  standNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  titleDeedNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    index: true
  },
  offerLetterNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    index: true
  },
  councilReferenceNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    index: true
  },

  // ── Registered Owner (Council / Company / Individual) ──────────────────────
  // NOTE: This is the authority-registered owner of the stand, which may be
  // a local council, a developer, or a previous owner. It is NOT used to
  // verify the seller's identity (seller identity is verified via KYC).
  registeredOwner: {
    fullName: {
      type: String,
      trim: true,
      default: 'Not Registered / Council'
    },
    entityType: {
      type: String,
      enum: ['INDIVIDUAL', 'COMPANY', 'COUNCIL', 'DEVELOPER', 'UNKNOWN'],
      default: 'UNKNOWN'
    }
  },

  // ── Text Address (human-readable location) ─────────────────────────────────
  address: {
    street: String,
    suburb: {
      type: String,
      required: true,
      enum: ['HARARE', 'CHITUNGWIZA', 'KADOMA', 'BULAWAYO', 'GWERU', 'MASVINGO', 'MUTARE']
    },
    city: String,
    province: String
  },

  // ── Geospatial Location (GeoJSON Point) ────────────────────────────────────
  // Kept separate from the address block to avoid Mongoose schema overwrite.
  geoLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude] — GeoJSON standard
      required: true
    }
  },

  // ── Stand Details ──────────────────────────────────────────────────────────
  standSize: {
    squareMeters: Number,
    hectares: Number
  },
  landUseType: {
    type: String,
    enum: ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL', 'MIXED_USE'],
    required: true
  },
  zoning: {
    type: String,
    enum: ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL', 'MIXED_USE']
  },

  // ── Stand Status ───────────────────────────────────────────────────────────
  status: {
    type: String,
    enum: [
      'VALID',             // Stand is registered and valid
      'DISPUTED',          // Ownership or boundary dispute exists
      'SOLD',              // Previously sold
      'DUPLICATE',         // Duplicate record detected
      'UNDER_INVESTIGATION',
      'NOT_FOUND',
      'UNALLOCATED',       // Municipality defined but not yet allocated
      'PRE_PROCESSING'     // In planning phase
    ],
    default: 'VALID'
  },
  allocationStatus: {
    type: String,
    enum: ['VACANT', 'ALLOCATED', 'LEASED', 'PENDING_TRANSFER'],
    default: 'VACANT'
  },
  disputeStatus: {
    type: String,
    enum: ['NONE', 'DISPUTED', 'UNDER_INVESTIGATION', 'RESOLVED'],
    default: 'NONE'
  },

  // ── Financial & Legal Compliance ───────────────────────────────────────────
  ratesCleared: {
    type: Boolean,
    default: true
  },
  encumbrances: {
    type: [String], // e.g., ['MORTGAGE', 'CAVEAT', 'LIEN']
    default: []
  },
  isEligibleForResale: {
    type: Boolean,
    default: true
  },

  // ── Metadata ───────────────────────────────────────────────────────────────
  isVerifiedByAuthority: {
    type: Boolean,
    default: true
  },
  dateRegistered: Date,
  lastTransferDate: Date,
  remarks: String

}, {
  timestamps: true
});

// ── Indexes ─────────────────────────────────────────────────────────────────
authorityRecordsSchema.index({ 'address.suburb': 1, status: 1 });
authorityRecordsSchema.index({ geoLocation: '2dsphere' }); // Geospatial index
authorityRecordsSchema.index({ titleDeedNumber: 1, standNumber: 1 });

// ── Pre-save middleware ──────────────────────────────────────────────────────
authorityRecordsSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const AuthorityRecord = mongoose.model('AuthorityRecords', authorityRecordsSchema);

export default AuthorityRecord;
