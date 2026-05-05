import express from 'express';
import { verifyUser } from '../middlewares/auth-middleware.js';
import { requireRole } from '../middlewares/rbac-middleware.js';
import auditLogService from '../services/auditLogService.js';

const router = express.Router();

/**
 * Get audit logs with filters
 * Admin & System Admin only
 */
router.get('/', verifyUser, requireRole('ADMIN', 'SYSTEM_ADMIN'), async (req, res) => {
  try {
    const { userId, userRole, action, resourceType, resourceId, status, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filters = {
      userId: userId || undefined,
      userRole: userRole || undefined,
      action: action || undefined,
      resourceType: resourceType || undefined,
      resourceId: resourceId || undefined,
      status: status || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    const result = await auditLogService.getAuditLogs(filters, parseInt(page), parseInt(limit));

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
});

/**
 * Get audit trail for specific resource
 */
router.get('/resource/:resourceType/:resourceId', verifyUser, requireRole('ADMIN', 'SYSTEM_ADMIN'), async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    const { limit = 50 } = req.query;

    const logs = await auditLogService.getResourceAuditTrail(resourceType, resourceId, parseInt(limit));

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching resource audit trail:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit trail',
      error: error.message
    });
  }
});

/**
 * Get user's action history
 */
router.get('/user/:userId', verifyUser, requireRole('ADMIN', 'SYSTEM_ADMIN'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    const logs = await auditLogService.getUserActionHistory(userId, parseInt(limit));

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching user action history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch action history',
      error: error.message
    });
  }
});

/**
 * Get audit summary for dashboard
 */
router.get('/summary/actions', verifyUser, requireRole('ADMIN', 'SYSTEM_ADMIN'), async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const summary = await auditLogService.getAuditSummary(parseInt(days));

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching audit summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit summary',
      error: error.message
    });
  }
});

/**
 * Check for suspicious activity by user
 */
router.get('/suspicious/:userId', verifyUser, requireRole('ADMIN', 'SYSTEM_ADMIN'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeWindow = 60 } = req.query;

    const suspicious = await auditLogService.checkSuspiciousActivity(userId, parseInt(timeWindow));

    res.status(200).json({
      success: true,
      data: suspicious
    });
  } catch (error) {
    console.error('Error checking suspicious activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check suspicious activity',
      error: error.message
    });
  }
});

/**
 * Export audit logs as CSV
 */
router.get('/export/csv', verifyUser, requireRole('ADMIN', 'SYSTEM_ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate, userRole, action } = req.query;

    const filters = {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      userRole: userRole || undefined,
      action: action || undefined
    };

    const csv = await auditLogService.exportAuditLogs(filters);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export audit logs',
      error: error.message
    });
  }
});

export default router;
