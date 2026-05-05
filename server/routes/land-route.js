import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import {
  createLandListing,
  getLandListings,
  getLandById,
  updateLandListing,
  deleteLandListing,
  markLandAsSold,
  createListingRevision,
  verifyLandOwnership,
  searchLands,
  flagLandAsSuspicious,
  resolveFraudFlag,
  getVerificationStatus,
  uploadLandDocuments,
  getLandAnalytics,
  getPublicListings,
  checkLocation,
  searchAuthorityRegistry
} from '../controllers/landController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth-middleware.js';
import { validateRequest } from '../middlewares/validation-middleware.js';
import { uploadDocuments } from '../middlewares/upload-middleware.js';

const router = express.Router();

// Get all public listings (only verified)
router.get('/public', getPublicListings);

// Live check for location verification
router.get('/check-location', authenticateToken, checkLocation);

// Search authority registry by address
router.get('/authority-search', authenticateToken, searchAuthorityRegistry);

// Create new land listing
router.post('/',
  authenticateToken,
  authorizeRoles(['SELLER', 'SYSTEM_ADMIN', 'MUNICIPAL_OFFICER', 'VERIFICATION_OFFICER']),
  [
    body('standNumber')
      .notEmpty()
      .withMessage('Stand number is required')
      .matches(/^[A-Z0-9\s-]+$/i)
      .withMessage('Stand number must contain only letters, numbers, hyphens, and spaces'),
    body('titleDeedNumber')
      .notEmpty()
      .withMessage('Title deed number is required')
      .matches(/^[A-Z0-9\/-]+$/i)
      .withMessage('Title deed number must contain only letters, numbers, hyphens, and slashes'),
    body('location.address.suburb')
      .isIn(['HARARE', 'CHITUNGWIZA', 'KADOMA', 'BULAWAYO', 'GWERU', 'MASVINGO', 'MUTARE'])
      .withMessage('Invalid suburb'),
    body('location.coordinates.latitude')
      .optional({ checkFalsy: true })
      .isFloat({ min: -90, max: 90 })
      .withMessage('Invalid latitude'),
    body('location.coordinates.longitude')
      .optional({ checkFalsy: true })
      .isFloat({ min: -180, max: 180 })
      .withMessage('Invalid longitude'),
    body('landDetails.size.squareMeters')
      .isFloat({ min: 1 })
      .withMessage('Size must be greater than 0'),
    body('landDetails.zoning')
      .isIn(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL', 'MIXED_USE'])
      .withMessage('Invalid zoning type'),
    body('transaction.listedPrice.amount')
      .isFloat({ min: 0 })
      .withMessage('Price must be greater than 0')
  ],
  validateRequest,
  createLandListing
);

// Get all land listings with filters
router.get('/',
  authenticateToken,
  [
    query('suburb')
      .optional()
      .isIn(['HARARE', 'CHITUNGWIZA', 'KADOMA', 'BULAWAYO', 'GWERU', 'MASVINGO', 'MUTARE']),
    query('zoning')
      .optional()
      .isIn(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL', 'MIXED_USE']),
    query('status')
      .optional()
      .isIn(['AVAILABLE', 'PENDING_SALE', 'SOLD', 'UNDER_REVIEW', 'FLAGGED', 'VERIFIED', 'REJECTED', 'PENDING_VERIFICATION']),
    query('verified')
      .optional()
      .isBoolean(),
    query('minPrice')
      .optional()
      .isFloat({ min: 0 }),
    query('maxPrice')
      .optional()
      .isFloat({ min: 0 }),
    query('minSize')
      .optional()
      .isFloat({ min: 0 }),
    query('maxSize')
      .optional()
      .isFloat({ min: 0 }),
    query('page')
      .optional()
      .isInt({ min: 1 }),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  getLandListings
);

// Search lands by various criteria
router.get('/search',
  authenticateToken,
  [
    query('q')
      .notEmpty()
      .withMessage('Search query is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Search query must be between 2 and 100 characters')
  ],
  // Added a custom middleware to log validation errors before `validateRequest` processes them
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
    }
    next();
  },
  validateRequest,
  searchLands
);

// Get land analytics (for admins and municipal officers)
router.get('/analytics',
  authenticateToken,
  authorizeRoles(['SYSTEM_ADMIN', 'MUNICIPAL_OFFICER']),
  getLandAnalytics
);

// Get specific land by ID
router.get('/:landId',
  authenticateToken,
  [
    param('landId')
      .isMongoId()
      .withMessage('Invalid land ID')
  ],
  validateRequest,
  getLandById
);

// Update land listing
router.put('/:landId',
  authenticateToken,
  authorizeRoles(['SELLER', 'SYSTEM_ADMIN', 'MUNICIPAL_OFFICER', 'VERIFICATION_OFFICER']),
  [
    param('landId')
      .isMongoId()
      .withMessage('Invalid land ID'),
    body('transaction.listedPrice.amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be greater than 0'),
    body('landDetails.zoning')
      .optional()
      .isIn(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL', 'MIXED_USE'])
      .withMessage('Invalid zoning type')
  ],
  validateRequest,
  updateLandListing
);

// Delete land listing
router.delete('/:landId',
  authenticateToken,
  authorizeRoles(['SELLER', 'SYSTEM_ADMIN', 'MUNICIPAL_OFFICER', 'VERIFICATION_OFFICER']),
  [
    param('landId')
      .isMongoId()
      .withMessage('Invalid land ID')
  ],
  validateRequest,
  deleteLandListing
);

// Verify land ownership (municipal officers and admins only)
router.post('/:landId/verify',
  authenticateToken,
  authorizeRoles(['MUNICIPAL_OFFICER', 'SYSTEM_ADMIN', 'VERIFICATION_OFFICER']),
  [
    param('landId')
      .isMongoId()
      .withMessage('Invalid land ID'),
    body('verificationStatus')
      .isIn(['VERIFIED', 'REJECTED'])
      .withMessage('Invalid verification status'),
    body('verificationNotes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Verification notes cannot exceed 500 characters')
  ],
  validateRequest,
  verifyLandOwnership
);

// Get verification status for a land
router.get('/:landId/verification-status',
  authenticateToken,
  [
    param('landId')
      .isMongoId()
      .withMessage('Invalid land ID')
  ],
  validateRequest,
  getVerificationStatus
);

// Upload land documents
router.post('/:landId/documents',
  authenticateToken,
  authorizeRoles(['SELLER', 'SYSTEM_ADMIN', 'MUNICIPAL_OFFICER', 'VERIFICATION_OFFICER']),
  uploadDocuments,
  [
    param('landId')
      .isMongoId()
      .withMessage('Invalid land ID')
  ],
  validateRequest,
  uploadLandDocuments
);

// Flag land as suspicious (buyers, officers, and admins only - NOT sellers)
router.post('/:landId/flag',
  authenticateToken,
  authorizeRoles(['BUYER', 'MUNICIPAL_OFFICER', 'VERIFICATION_OFFICER', 'SYSTEM_ADMIN']),
  [
    param('landId')
      .isMongoId()
      .withMessage('Invalid land ID'),
    body('flagType')
      .isIn(['DUPLICATE_LISTING', 'OWNERSHIP_DISPUTE', 'FAKE_DOCUMENTS', 'SUSPICIOUS_ACTIVITY'])
      .withMessage('Invalid flag type'),
    body('description')
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 10, max: 500 })
      .withMessage('Description must be between 10 and 500 characters'),
    body('evidence')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Evidence cannot exceed 1000 characters'),
    body('evidence')
      .if(body('flagType').equals('FAKE_DOCUMENTS'))
      .notEmpty()
      .withMessage('Evidence is required when flagging for fake documents')
  ],
  validateRequest,
  flagLandAsSuspicious
);

// Resolve a fraud flag (officers and admins only)
router.patch('/:landId/flags/:flagIndex/resolve',
  authenticateToken,
  authorizeRoles(['MUNICIPAL_OFFICER', 'VERIFICATION_OFFICER', 'SYSTEM_ADMIN']),
  [
    param('landId')
      .isMongoId()
      .withMessage('Invalid land ID'),
    param('flagIndex')
      .isInt({ min: 0 })
      .withMessage('Invalid flag index'),
    body('resolution')
      .isIn(['VALID', 'FALSE_ALARM'])
      .withMessage('Resolution must be VALID or FALSE_ALARM')
  ],
  validateRequest,
  resolveFraudFlag
);

// Mark land listing as sold
router.post('/:landId/mark-sold',
  authenticateToken,
  authorizeRoles(['SELLER', 'SYSTEM_ADMIN']),
  [
    param('landId')
      .isMongoId()
      .withMessage('Invalid land ID')
  ],
  validateRequest,
  markLandAsSold
);

// Create a new revision of a verified listing for editing
router.post('/:landId/create-revision',
  authenticateToken,
  authorizeRoles(['SELLER', 'SYSTEM_ADMIN']),
  [
    param('landId')
      .isMongoId()
      .withMessage('Invalid land ID')
  ],
  validateRequest,
  createListingRevision
);

export default router;
