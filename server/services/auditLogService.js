import AuditLog from '../models/audit-log-model.js';

/**
 * Audit Logging Service
 * Tracks all admin/sensitive actions for compliance and security
 */

class AuditLogService {
  /**
   * Log an action to audit trail
   */
  async logAction(req, actionData) {
    try {
      const logEntry = {
        userId: req.user?.id,
        userRole: req.user?.role,
        action: actionData.action,
        actionCategory: actionData.actionCategory,
        resourceType: actionData.resourceType,
        resourceId: actionData.resourceId,
        resourceName: actionData.resourceName,
        changes: actionData.changes,
        reason: actionData.reason,
        ipAddress: this.getClientIp(req),
        userAgent: req.headers['user-agent'],
        status: actionData.status || 'SUCCESS',
        errorMessage: actionData.errorMessage,
        metadata: actionData.metadata
      };

      const auditLog = await AuditLog.log(logEntry);
      return auditLog;
    } catch (error) {
      console.error('Error logging action:', error);
      // Don't throw - audit logging failure shouldn't break the action
    }
  }

  /**
   * Log land verification/rejection
   */
  async logVerificationAction(req, landId, action, details) {
    await this.logAction(req, {
      action: `LAND_${action}`,
      actionCategory: action === 'VERIFIED' ? 'VERIFY' : 'REJECT',
      resourceType: 'LAND',
      resourceId: landId,
      reason: details.reason,
      metadata: {
        verificationScore: details.verificationScore,
        fraudRiskScore: details.fraudRiskScore,
        notes: details.notes
      }
    });
  }

  /**
   * Log user action
   */
  async logUserAction(req, userId, action, changes = null) {
    await this.logAction(req, {
      action: `USER_${action}`,
      actionCategory: action === 'CREATED' ? 'CREATE' : action === 'DELETED' ? 'DELETE' : 'UPDATE',
      resourceType: 'USER',
      resourceId: userId,
      changes
    });
  }

  /**
   * Log document action
   */
  async logDocumentAction(req, documentId, action, metadata = {}) {
    await this.logAction(req, {
      action: `DOCUMENT_${action}`,
      actionCategory: action === 'UPLOADED' ? 'CREATE' : action === 'VERIFIED' ? 'VERIFY' : 'UPDATE',
      resourceType: 'DOCUMENT',
      resourceId: documentId,
      metadata
    });
  }

  /**
   * Log authority record modification
   */
  async logAuthorityRecordAction(req, recordId, action, changes) {
    await this.logAction(req, {
      action: `AUTHORITY_RECORD_${action}`,
      actionCategory: action === 'CREATED' ? 'CREATE' : action === 'DELETED' ? 'DELETE' : 'UPDATE',
      resourceType: 'AUTHORITY_RECORD',
      resourceId: recordId,
      reason: 'System admin maintenance',
      changes
    });
  }

  /**
   * Get audit trail for a resource
   */
  async getResourceAuditTrail(resourceType, resourceId, limit = 50) {
    try {
      const logs = await AuditLog.find({
        resourceType,
        resourceId
      })
        .populate('userId', 'firstName lastName email role')
        .sort({ createdAt: -1 })
        .limit(limit);

      return logs;
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      throw error;
    }
  }

  /**
   * Get user's action history
   */
  async getUserActionHistory(userId, limit = 50) {
    try {
      const logs = await AuditLog.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit);

      return logs;
    } catch (error) {
      console.error('Error fetching user action history:', error);
      throw error;
    }
  }

  /**
   * Get all actions by action type
   */
  async getActionsByType(action, limit = 50) {
    try {
      const logs = await AuditLog.find({ action })
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(limit);

      return logs;
    } catch (error) {
      console.error('Error fetching actions by type:', error);
      throw error;
    }
  }

  /**
   * Get audit logs with advanced filtering
   */
  async getAuditLogs(filters = {}, page = 1, limit = 20) {
    try {
      const query = {};

      if (filters.userId) query.userId = filters.userId;
      if (filters.userRole) query.userRole = filters.userRole;
      if (filters.action) query.action = filters.action;
      if (filters.resourceType) query.resourceType = filters.resourceType;
      if (filters.resourceId) query.resourceId = filters.resourceId;
      if (filters.status) query.status = filters.status;

      // Date range filter
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
      }

      const skip = (page - 1) * limit;

      const logs = await AuditLog.find(query)
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await AuditLog.countDocuments(query);

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  /**
   * Export audit logs (for compliance/reporting)
   */
  async exportAuditLogs(filters = {}) {
    try {
      const query = {};

      if (filters.userId) query.userId = filters.userId;
      if (filters.userRole) query.userRole = filters.userRole;
      if (filters.action) query.action = filters.action;
      if (filters.resourceType) query.resourceType = filters.resourceType;

      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
      }

      const logs = await AuditLog.find(query)
        .populate('userId', 'firstName lastName email')
        .lean();

      // Convert to CSV format
      const csv = this.convertToCSV(logs);
      return csv;
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  }

  /**
   * Check for suspicious activity patterns
   */
  async checkSuspiciousActivity(userId, timeWindowMinutes = 60) {
    try {
      const timeAgo = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

      const recentActions = await AuditLog.find({
        userId,
        createdAt: { $gte: timeAgo }
      });

      const suspicious = {
        hasHighVolume: recentActions.length > 20,
        hasRapidRejections: this.countActions(recentActions, 'LAND_REJECTED') > 10,
        hasRapidApprovals: this.countActions(recentActions, 'LAND_VERIFIED') > 15,
        actions: recentActions
      };

      return suspicious;
    } catch (error) {
      console.error('Error checking suspicious activity:', error);
      throw error;
    }
  }

  /**
   * Get audit summary for dashboard
   */
  async getAuditSummary(days = 7) {
    try {
      const dateAgo = new Date();
      dateAgo.setDate(dateAgo.getDate() - days);

      const summary = await AuditLog.aggregate([
        {
          $match: { createdAt: { $gte: dateAgo } }
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      return summary;
    } catch (error) {
      console.error('Error generating audit summary:', error);
      throw error;
    }
  }

  /**
   * Helper: Get client IP
   */
  getClientIp(req) {
    return (
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.connection?.remoteAddress ||
      'UNKNOWN'
    );
  }

  /**
   * Helper: Count specific actions
   */
  countActions(logs, actionType) {
    return logs.filter(log => log.action === actionType).length;
  }

  /**
   * Helper: Convert to CSV
   */
  convertToCSV(logs) {
    if (logs.length === 0) return 'No logs found';

    const headers = ['Date', 'User', 'Role', 'Action', 'Resource Type', 'Resource ID', 'Status'];
    const rows = logs.map(log => [
      new Date(log.createdAt).toISOString(),
      log.userId?.firstName + ' ' + log.userId?.lastName,
      log.userRole,
      log.action,
      log.resourceType,
      log.resourceId || 'N/A',
      log.status
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csv;
  }
}

export default new AuditLogService();
