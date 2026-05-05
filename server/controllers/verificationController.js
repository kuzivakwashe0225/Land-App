import Land from '../models/landModel.js';
import User from '../models/user-model.js';
import standVerificationService from '../services/standVerificationService.js';
import { createNotification } from '../utils/notifications.js';

/**
 * Perform comprehensive stand authentication check
 * Called before admin approval
 */
export const performStandVerification = async (req, res) => {
  try {
    const { landId } = req.params;

    // Get land data
    const land = await Land.findById(landId).populate('owner', 'firstName lastName email nationalId');

    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Land not found'
      });
    }

    // Check if already verified
    if (land.verification.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Land is already verified'
      });
    }

    // Perform comprehensive verification
    const verificationData = {
      standNumber: land.standNumber,
      titleDeedNumber: land.titleDeedNumber,
      ownerName: `${land.owner.firstName} ${land.owner.lastName}`,
      suburb: land.location.address.suburb,
      coordinates: land.location.coordinates,
      sellerNationalId: land.owner.nationalId
    };

    const verificationResult = await standVerificationService.verifyStandAuthenticity(verificationData);

    // If it's a commercial stand, we should flag it and reduce the score to prevent auto-approval
    if (land.landDetails?.zoning === 'COMMERCIAL') {
      verificationResult.isAuthentic = false;
      verificationResult.authenticationScore = Math.min(verificationResult.authenticationScore, 30);
      verificationResult.flags.push('COMMERCIAL_STAND_RESTRICTION');
      verificationResult.warnings.push('Commercial stands are currently restricted from verification');
    }

    // Store verification result in land document
    land.verification.verificationResult = {
      verificationId: verificationResult.verificationId,
      authenticationScore: verificationResult.authenticationScore,
      isAuthentic: verificationResult.isAuthentic,
      checks: verificationResult.checks,
      flags: verificationResult.flags,
      warnings: verificationResult.warnings,
      timestamp: new Date(),
      deedsOffice: verificationResult.details.deedsOffice,
      municipal: verificationResult.details.municipal,
      ownership: verificationResult.details.ownership,
      coordinates: verificationResult.details.coordinates,
      encumbrances: verificationResult.details.encumbrances,
      disputes: verificationResult.details.disputes,
      rates: verificationResult.details.rates
    };

    await land.save();

    // Return verification report
    const report = standVerificationService.getVerificationReport(verificationResult);

    res.status(200).json({
      success: true,
      message: 'Stand verification completed',
      report,
      recommendation: report.recommendation
    });
  } catch (error) {
    console.error('Error performing stand verification:', error);
    res.status(500).json({
      success: false,
      message: 'Stand verification failed',
      error: error.message
    });
  }
};

/**
 * Get verification report for a land
 */
export const getVerificationReport = async (req, res) => {
  try {
    const { landId } = req.params;

    const land = await Land.findById(landId).populate('owner');

    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Land not found'
      });
    }

    if (!land.verification.verificationResult) {
      return res.status(400).json({
        success: false,
        message: 'No verification report available. Run verification first.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        landId: land._id,
        standNumber: land.standNumber,
        titleDeedNumber: land.titleDeedNumber,
        owner: {
          name: `${land.owner.firstName} ${land.owner.lastName}`,
          email: land.owner.email,
          nationalId: land.owner.nationalId
        },
        verificationReport: land.verification.verificationResult
      }
    });
  } catch (error) {
    console.error('Error getting verification report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get verification report',
      error: error.message
    });
  }
};

/**
 * Admin approves land after verification
 * Updates land status to VERIFIED
 */
export const approveLandListing = async (req, res) => {
  try {
    const { landId } = req.params;
    const { adminNotes } = req.body;

    const land = await Land.findById(landId).populate('owner');

    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Land not found'
      });
    }

    // Check if verification was performed
    if (!land.verification.verificationResult) {
      return res.status(400).json({
        success: false,
        message: 'Verification must be performed before approval'
      });
    }

    // Check authentication score - Require notes for low scores (<70)
    const score = land.verification.verificationResult.authenticationScore;
    if (score < 70) {
      if (!adminNotes || adminNotes.trim() === '') {
        return res.status(400).json({
          success: false,
          message: `Mandatory Reason Required: Verification score is low (${score}%). Please provide an explanation in the notes to proceed with approval.`
        });
      }
      console.warn(`[AUDIT] Low-score Approval by ${req.user.role} (${req.user.id}) for land ${land._id}. Score: ${score}%. Notes: ${adminNotes}`);
    }

    // Check zoning - only residential stands allowed for testing
    if (land.landDetails?.zoning === 'COMMERCIAL') {
      return res.status(400).json({
        success: false,
        message: 'Commercial stands cannot be verified at this stage. This system is currently restricted to residential stands for testing purposes.'
      });
    }

    // Update land status
    land.verification.status = 'VERIFIED';
    land.verification.isVerified = true;
    land.verification.verifiedBy = req.user.id;
    land.verification.verificationDate = new Date();
    land.transaction.status = 'AVAILABLE';

    // Add admin notes
    if (adminNotes) {
      land.verification.adminNotes = adminNotes;
    }

    await land.save();

    // Notify seller
    createNotification(land.owner._id, 'LAND_VERIFIED', {
      landId: land._id,
      standNumber: land.standNumber,
      verificationScore: score
    });

    res.status(200).json({
      success: true,
      message: `Land listing approved and verified! Authentication score: ${score}%`,
      data: {
        landId: land._id,
        standNumber: land.standNumber,
        status: land.verification.status,
        authenticationScore: score
      }
    });
  } catch (error) {
    console.error('Error approving land listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve land listing',
      error: error.message
    });
  }
};

/**
 * Admin rejects land listing with detailed reason
 */
export const rejectLandListing = async (req, res) => {
  try {
    const { landId } = req.params;
    const { reason, adminNotes } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const land = await Land.findById(landId).populate('owner');

    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Land not found'
      });
    }

    // Update land status
    land.verification.status = 'REJECTED';
    land.verification.isVerified = false;
    land.verification.verifiedBy = req.user.id;
    land.verification.verificationDate = new Date();
    land.verification.rejectionReason = reason;
    if (adminNotes) {
      land.verification.adminNotes = adminNotes;
    }

    land.transaction.status = 'FLAGGED';

    await land.save();

    // Notify seller with rejection details
    createNotification(land.owner._id, 'LAND_VERIFICATION_REJECTED', {
      landId: land._id,
      standNumber: land.standNumber,
      reason,
      notes: adminNotes
    });

    res.status(200).json({
      success: true,
      message: 'Land listing rejected',
      data: {
        landId: land._id,
        standNumber: land.standNumber,
        status: land.verification.status,
        reason
      }
    });
  } catch (error) {
    console.error('Error rejecting land listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject land listing',
      error: error.message
    });
  }
};

/**
 * Get all lands requiring verification (PENDING status)
 * Only for admins
 */
export const getPendingVerifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, suburb, seller } = req.query;

    const filter = {
      'verification.status': 'PENDING'
    };

    if (suburb) {
      filter['location.address.suburb'] = suburb;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const lands = await Land.find(filter)
      .populate('owner', 'firstName lastName email nationalId verification.kycStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Land.countDocuments(filter);

    // Add verification status for each land
    const landsWithStatus = lands.map(land => ({
      _id: land._id,
      standNumber: land.standNumber,
      titleDeedNumber: land.titleDeedNumber,
      owner: {
        id: land.owner._id,
        name: `${land.owner.firstName} ${land.owner.lastName}`,
        email: land.owner.email,
        kycStatus: land.owner.verification.kycStatus
      },
      location: land.location.address,
      price: land.transaction.listedPrice.amount,
      size: land.landDetails.size.squareMeters,
      verificationStatus: land.verification.status,
      verificationResult: land.verification.verificationResult ? {
        score: land.verification.verificationResult.authenticationScore,
        flags: land.verification.verificationResult.flags.length,
        warnings: land.verification.verificationResult.warnings.length
      } : null,
      createdAt: land.createdAt,
      requiresVerification: true
    }));

    res.status(200).json({
      success: true,
      data: landsWithStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting pending verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending verifications',
      error: error.message
    });
  }
};

/**
 * Get verification statistics for dashboard
 */
export const getVerificationStats = async (req, res) => {
  try {
    const stats = {
      totalListings: await Land.countDocuments(),
      pendingVerification: await Land.countDocuments({ 'verification.status': 'PENDING' }),
      verifiedListings: await Land.countDocuments({ 'verification.status': 'VERIFIED' }),
      rejectedListings: await Land.countDocuments({ 'verification.status': 'REJECTED' }),
      flaggedListings: await Land.countDocuments({ 'transaction.status': 'FLAGGED' }),

      authenticationScores: await Land.aggregate([
        { $match: { 'verification.verificationResult': { $exists: true } } },
        {
          $group: {
            _id: null,
            avgScore: { $avg: '$verification.verificationResult.authenticationScore' },
            minScore: { $min: '$verification.verificationResult.authenticationScore' },
            maxScore: { $max: '$verification.verificationResult.authenticationScore' }
          }
        }
      ]),

      verificationsBySuburb: await Land.aggregate([
        {
          $group: {
            _id: '$location.address.suburb',
            total: { $sum: 1 },
            verified: {
              $sum: { $cond: [{ $eq: ['$verification.status', 'VERIFIED'] }, 1, 0] }
            },
            pending: {
              $sum: { $cond: [{ $eq: ['$verification.status', 'PENDING'] }, 1, 0] }
            }
          }
        }
      ])
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting verification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get verification statistics',
      error: error.message
    });
  }
};
