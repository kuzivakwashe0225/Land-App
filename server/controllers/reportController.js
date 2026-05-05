import Report from '../models/report-model.js';
import Land from '../models/landModel.js';
import User from '../models/user-model.js';
import { createNotification } from '../utils/notifications.js';

// Create fraud report
export const createFraudReport = async (req, res) => {
  try {
    const {
      suspiciousLand,
      fraudType,
      description,
      reporterInfo,
      contactPreference
    } = req.body;

    // Validate required fields
    if (!suspiciousLand.standNumber || !description) {
      return res.status(400).json({
        success: false,
        message: 'Stand number and description are required'
      });
    }

    // Find the land by stand number
    const land = await Land.findOne({
      standNumber: suspiciousLand.standNumber.toUpperCase()
    });

    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Stand not found in the system'
      });
    }

    // Create report
    const report = new Report({
      reporter: req.user?.id || null,
      listing: land._id,
      reason: fraudType,
      details: description,
      status: 'OPEN'
    });

    // Store reporter info if not anonymous
    if (!reporterInfo.anonymous) {
      report.reporterEmail = reporterInfo.email;
      report.reporterPhone = reporterInfo.phone;
    }
    report.reporterAnonymous = reporterInfo.anonymous;
    report.contactPreference = contactPreference;

    await report.save();

    // Update land status to flagged if not already
    if (land.transaction.status !== 'FLAGGED') {
      land.transaction.status = 'FLAGGED';
      land.verification.status = 'SUSPENDED';
      await land.save();
    }

    // Add fraud flag to land (only if reporter is authenticated)
    if (req.user?.id) {
      land.fraudFlags.push({
        flagType: 'SUSPICIOUS_ACTIVITY',
        reportedBy: req.user.id,
        reportedAt: new Date(),
        description: `Fraud report: ${description}`,
        status: 'PENDING'
      });
      await land.save();
    }

    // Notify relevant officers
    const targetRoles = ['MUNICIPAL_OFFICER', 'VERIFICATION_OFFICER', 'SYSTEM_ADMIN'];
    const officers = await User.find({
      role: { $in: targetRoles },
      'activity.accountStatus': 'ACTIVE'
    });

    officers.forEach(officer => {
      createNotification(officer._id, 'FRAUD_REPORT', {
        reportId: report._id,
        landId: land._id,
        standNumber: land.standNumber,
        fraudType: fraudType,
        anonymous: reporterInfo.anonymous
      });
    });

    res.status(201).json({
      success: true,
      message: 'Fraud report submitted successfully. We will investigate within 24-48 hours.',
      reportId: report._id
    });
  } catch (error) {
    console.error('Error creating fraud report:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all fraud reports (admin only)
export const getAllReports = async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;

    const filter = status !== 'all' ? { status } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reports = await Report.find(filter)
      .populate('reporter', 'firstName lastName email')
      .populate('listing', 'standNumber location owner')
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
    console.error('Error getting reports:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update report status (admin only)
export const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, adminNotes } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    report.status = status;
    if (adminNotes) {
      report.adminNotes = adminNotes;
    }

    await report.save();

    res.status(200).json({
      success: true,
      message: 'Report status updated successfully',
      data: report
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get report by ID
export const getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId)
      .populate('reporter', 'firstName lastName email')
      .populate('listing', 'standNumber location owner transaction');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error getting report:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
