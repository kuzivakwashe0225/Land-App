import mongoose from 'mongoose';

const authorityRecordsSchema = new mongoose.Schema({
  standNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  currentOwner: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    nationalId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    }
  },
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
  standSize: {
    squareMeters: Number,
    hectares: Number
  },
  landUseType: {
    type: String,
    enum: ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL', 'MIXED_USE'],
    required: true
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
  location: {
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
  status: {
    type: String,
    enum: [
      'VALID', 
      'DISPUTED', 
      'SOLD', 
      'DUPLICATE', 
      'UNDER_INVESTIGATION', 
      'NOT_FOUND', 
      'UNALLOCATED',     // Municipality has defined the stand but not allocated it to anyone
      'PRE_PROCESSING',  // Stand is in the planning phase, not yet ready for allocation
      'PROCESSED'        // Stand is ready for allocation or sale
    ],
    default: 'VALID'
  },
  allocationStatus: {
    type: String,
    enum: ['VACANT', 'ALLOCATED', 'LEASED', 'PENDING_TRANSFER'],
    default: 'VACANT'
  },
  isVerifiedByAuthority: {
    type: Boolean,
    default: true
  },
  // Additional metadata
  registeredOwner: String,
  dateRegistered: Date,
  lastTransferDate: Date,
  encumbrances: [String], // e.g., ['MORTGAGE', 'CAVEAT']
  ratesCleared: { type: Boolean, default: true },
  remarks: String,

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient searching
authorityRecordsSchema.index({ standNumber: 1, nationalId: 1 });
authorityRecordsSchema.index({ 'address.suburb': 1, status: 1 });
authorityRecordsSchema.index({ location: '2dsphere' }); // For geospatial queries

// Pre-save middleware to update timestamp
authorityRecordsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const AuthorityRecords = mongoose.model('AuthorityRecords', authorityRecordsSchema);

export default AuthorityRecords;
