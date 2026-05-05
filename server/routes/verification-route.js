import express from 'express';
import { body, param, query } from 'express-validator';
import {
  performStandVerification,
  getVerificationReport,
  approveLandListing,
  rejectLandListing,
  getPendingVerifications,
  getVerificationStats
} from '../controllers/verificationController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth-middleware.js';
import { validateRequest } from '../middlewares/validation-middleware.js';

const router = express.Router();

/**
 * Perform comprehensive stand verification (authentication check)
 * POST /api/verification/verify/:landId
 */
router.post('/verify/:landId',
  authenticateToken,
  authorizeRoles(['SYSTEM_ADMIN', 'VERIFICATION_OFFICER', 'MUNICIPAL_OFFICER']),
  [
    param('landId')
      .isMongoId()
      .withMessage('Invalid land ID')
  ],
  validateRequest,
  performStandVerification
);

/**
 * Get verification report for a land
 * GET /api/verification/report/:landId
 */
router.get('/report/:landId',
  authenticateToken,
  authorizeRoles(['SYSTEM_ADMIN', 'VERIFICATION_OFFICER', 'MUNICIPAL_OFFICER']),
  [
    param('landId')
      .isMongoId()
      .withMessage('Invalid land ID')
  ],
  validateRequest,
  getVerificationReport
);

/**
 * Approve land listing (after verification passed)
 * POST /api/verification/approve/:landId
 */
router.post('/approve/:landId',
  authenticateToken,
  authorizeRoles(['SYSTEM_ADMIN', 'VERIFICATION_OFFICER']),
  [
    param('landId')
      .isMongoId()
      .withMessage('Invalid land ID'),
    body('adminNotes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ],
  validateRequest,
  approveLandListing
);

/**
 * Reject land listing (after verification failed)
 * POST /api/verification/reject/:landId
 */
router.post('/reject/:landId',
  authenticateToken,
  authorizeRoles(['SYSTEM_ADMIN', 'VERIFICATION_OFFICER']),
  [
    param('landId')
      .isMongoId()
      .withMessage('Invalid land ID'),
    body('reason')
      .notEmpty()
      .withMessage('Rejection reason is required')
      .isLength({ min: 10, max: 500 })
      .withMessage('Reason must be between 10 and 500 characters'),
    body('adminNotes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ],
  validateRequest,
  rejectLandListing
);

/**
 * Get all pending verifications
 * GET /api/verification/pending
 */
router.get('/pending',
  authenticateToken,
  authorizeRoles(['SYSTEM_ADMIN', 'VERIFICATION_OFFICER', 'MUNICIPAL_OFFICER']),
  [
    query('page')
      .optional()
      .isInt({ min: 1 }),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }),
    query('suburb')
      .optional()
      .isIn(['HARARE', 'CHITUNGWIZA', 'KADOMA', 'BULAWAYO', 'GWERU', 'MASVINGO', 'MUTARE'])
  ],
  validateRequest,
  getPendingVerifications
);

/**
 * Get verification statistics
 * GET /api/verification/stats
 */
router.get('/stats',
  authenticateToken,
  authorizeRoles(['SYSTEM_ADMIN', 'VERIFICATION_OFFICER']),
  getVerificationStats
);

export default router;
