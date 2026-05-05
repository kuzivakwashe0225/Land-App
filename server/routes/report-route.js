import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createFraudReport,
  getAllReports,
  updateReportStatus,
  getReportById
} from '../controllers/reportController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth-middleware.js';
import { validateRequest } from '../middlewares/validation-middleware.js';

const router = express.Router();

// Create fraud report (public - can be anonymous)
router.post('/create',
  [
    body('suspiciousLand.standNumber')
      .notEmpty()
      .withMessage('Stand number is required'),
    body('fraudType')
      .notEmpty()
      .withMessage('Fraud type is required'),
    body('description')
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters'),
    body('reporterInfo.anonymous')
      .optional()
      .isBoolean(),
    body('reporterInfo.email')
      .optional()
      .isEmail(),
    body('reporterInfo.phone')
      .optional()
  ],
  validateRequest,
  createFraudReport
);

// Get all reports (admin/officers only)
router.get('/',
  authenticateToken,
  authorizeRoles(['SYSTEM_ADMIN', 'MUNICIPAL_OFFICER', 'VERIFICATION_OFFICER']),
  [
    query('status')
      .optional()
      .isIn(['all', 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED']),
    query('page')
      .optional()
      .isInt({ min: 1 }),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  getAllReports
);

// Get report by ID
router.get('/:reportId',
  authenticateToken,
  authorizeRoles(['SYSTEM_ADMIN', 'MUNICIPAL_OFFICER', 'VERIFICATION_OFFICER']),
  [
    param('reportId')
      .isMongoId()
      .withMessage('Invalid report ID')
  ],
  validateRequest,
  getReportById
);

// Update report status (admin only)
router.put('/:reportId',
  authenticateToken,
  authorizeRoles(['SYSTEM_ADMIN', 'VERIFICATION_OFFICER']),
  [
    param('reportId')
      .isMongoId()
      .withMessage('Invalid report ID'),
    body('status')
      .isIn(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'])
      .withMessage('Invalid status'),
    body('adminNotes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Notes cannot exceed 1000 characters')
  ],
  validateRequest,
  updateReportStatus
);

export default router;
