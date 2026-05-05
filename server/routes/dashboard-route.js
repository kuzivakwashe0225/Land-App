import express from 'express';
import { verifyUser } from '../middlewares/auth-middleware.js';
import { requireRole } from '../middlewares/rbac-middleware.js';
import Land from '../models/landModel.js';
import User from '../models/user-model.js';
import Report from '../models/report-model.js';
import AuditLog from '../models/audit-log-model.js';

const router = express.Router();

/**
 * Get public dashboard statistics (for all users)
 * Shows platform-wide stats
 */
router.get('/public-stats', verifyUser, async (req, res) => {
  try {
    // Disable caching to ensure fresh data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const stats = {
      totalListings: await Land.countDocuments(),
      verifiedListings: await Land.countDocuments({ 
        'verification.status': { $in: ['VERIFIED', 'AUTO_VERIFIED'] }
      }),
      pendingListings: await Land.countDocuments({ 
        'verification.status': { $in: ['PENDING_VERIFICATION', 'REQUIRES_REVIEW'] } 
      }),
      rejectedListings: await Land.countDocuments({ 'verification.status': 'REJECTED' }),
      suspendedListings: await Land.countDocuments({ 'verification.status': 'SUSPENDED' })
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching public dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

/**
 * Get dashboard statistics
 * Accessible to: ADMIN, SYSTEM_ADMIN, VERIFICATION_OFFICER, MUNICIPAL_OFFICER
 */
router.get('/stats', verifyUser, requireRole('ADMIN', 'SYSTEM_ADMIN', 'VERIFICATION_OFFICER', 'MUNICIPAL_OFFICER'), async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.countDocuments(),
      totalSellers: await User.countDocuments({
        role: 'SELLER',
        'verification.kycStatus': 'APPROVED'
      }),
      totalBuyers: await User.countDocuments({ role: 'BUYER' }),
      totalListings: await Land.countDocuments(),
      submittedListings: await Land.countDocuments({ 'verification.status': 'SUBMITTED' }),
      pendingVerification: await Land.countDocuments({ 'verification.status': 'PENDING_VERIFICATION' }),
      verifiedListings: await Land.countDocuments({ 'verification.status': { $in: ['VERIFIED', 'AUTO_VERIFIED'] } }),
      rejectedListings: await Land.countDocuments({ 'verification.status': 'REJECTED' }),
      suspiciousListings: await Land.countDocuments({ 'verification.status': 'SUSPICIOUS' }),
      totalReports: await Report.countDocuments(),
      openReports: await Report.countDocuments({ status: 'OPEN' }),
      unresolvedReports: await Report.countDocuments({ status: { $in: ['OPEN', 'UNDER_REVIEW'] } })
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

/**
 * Get pending verifications
 */
router.get('/pending-verifications', verifyUser, requireRole('ADMIN', 'SYSTEM_ADMIN', 'VERIFICATION_OFFICER', 'MUNICIPAL_OFFICER'), async (req, res) => {
  try {
    const { page = 1, limit = 20, suburb } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { 'verification.status': 'PENDING_VERIFICATION' };
    if (suburb) {
      filter['location.address.suburb'] = suburb.toUpperCase();
    }

    const listings = await Land.find(filter)
      .populate('owner', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Land.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: listings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending verifications',
      error: error.message
    });
  }
});

/**
 * Get suspicious listings
 */
router.get('/suspicious-listings', verifyUser, requireRole('ADMIN', 'SYSTEM_ADMIN'), async (req, res) => {
  try {
    const listings = await Land.find({
      'verification.status': 'SUSPICIOUS'
    })
      .populate('owner', 'firstName lastName email')
      .sort({ 'fraudFlags.reportedAt': -1 });

    res.status(200).json({
      success: true,
      data: listings
    });
  } catch (error) {
    console.error('Error fetching suspicious listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suspicious listings',
      error: error.message
    });
  }
});

/**
 * Get fraud reports
 */
router.get('/fraud-reports', verifyUser, requireRole('ADMIN', 'SYSTEM_ADMIN', 'VERIFICATION_OFFICER', 'MUNICIPAL_OFFICER'), async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = status !== 'all' ? { status } : {};

    const reports = await Report.find(filter)
      .populate('reporter', 'firstName lastName email')
      .populate('listing', 'standNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching fraud reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fraud reports',
      error: error.message
    });
  }
});

/**
 * Get verification queue summary
 */
router.get('/verification-summary', verifyUser, requireRole('ADMIN', 'SYSTEM_ADMIN', 'VERIFICATION_OFFICER', 'MUNICIPAL_OFFICER'), async (req, res) => {
  try {
    const summary = await Land.aggregate([
      {
        $group: {
          _id: '$verification.status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const formatted = {};
    summary.forEach(item => {
      formatted[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    console.error('Error fetching verification summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch verification summary',
      error: error.message
    });
  }
});

/**
 * Get verification statistics by suburb
 */
router.get('/statistics-by-suburb', verifyUser, requireRole('ADMIN', 'SYSTEM_ADMIN'), async (req, res) => {
  try {
    const stats = await Land.aggregate([
      {
        $group: {
          _id: '$location.address.suburb',
          total: { $sum: 1 },
          verified: {
            $sum: { $cond: [{ $eq: ['$verification.status', 'VERIFIED'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$verification.status', 'PENDING_VERIFICATION'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$verification.status', 'REJECTED'] }, 1, 0] }
          },
          suspicious: {
            $sum: { $cond: [{ $eq: ['$verification.status', 'SUSPICIOUS'] }, 1, 0] }
          }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

export default router;
