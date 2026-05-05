/**
 * Role-Based Access Control Middleware
 * Defines permissions for each role
 */

const rolePermissions = {
  BUYER: {
    canViewListings: true,
    canViewVerifiedListings: true,
    canViewStandDetails: true,
    canViewMaps: true,
    canBookmark: true,
    canSendInquiry: true,
    canReportListing: true,
    canCreateListing: false,
    canVerifyListings: false,
    canApproveDocuments: false,
    canAccessAdminDashboard: false,
    canDeleteListings: false,
    canManageUsers: false,
    canAccessVerificationQueue: false,
    canManageRoles: false,
    canManageAuthorityRecords: false
  },
  SELLER: {
    canViewListings: true,
    canViewVerifiedListings: true,
    canViewStandDetails: true,
    canViewMaps: true,
    canBookmark: true,
    canSendInquiry: true,
    canReportListing: false,
    canCreateListing: true,
    canEditOwnListings: true,
    canViewOwnListings: true,
    canViewOwnDocuments: true,
    canUploadDocuments: true,
    canTrackVerificationStatus: true,
    canRespondToInquiries: true,
    canVerifyListings: false,
    canApproveDocuments: false,
    canAccessAdminDashboard: false,
    canDeleteListings: false,
    canManageUsers: false,
    canAccessVerificationQueue: false
  },
  VERIFICATION_OFFICER: {
    canViewListings: true,
    canViewPendingListings: true,
    canViewAllDocuments: true,
    canReviewDocuments: true,
    canAddVerificationNotes: true,
    canApproveListings: true,
    canRejectListings: true,
    canViewVerificationScore: true,
    canAccessVerificationQueue: true,
    canAccessDashboard: true,
    canCreateListing: false,
    canDeleteListings: false,
    canManageUsers: false,
    canManageRoles: false,
    canManageAuthorityRecords: false
  },
  MUNICIPAL_OFFICER: {
    canViewListings: true,
    canViewPendingListings: true,
    canViewAllDocuments: true,
    canReviewDocuments: true,
    canAddVerificationNotes: true,
    canApproveListings: true,
    canRejectListings: true,
    canViewVerificationScore: true,
    canAccessVerificationQueue: true,
    canAccessDashboard: true,
    canCreateListing: false,
    canDeleteListings: false,
    canManageUsers: false,
    canManageRoles: false
  },
  ADMIN: {
    canViewAllData: true,
    canManageUsers: true,
    canManageListings: true,
    canViewReports: true,
    canHandleComplaints: true,
    canAccessDashboard: true,
    canViewAnalytics: true,
    canDeleteListings: true,
    canSuspendUsers: true,
    canViewAuditLogs: true,
    canAccessVerificationQueue: true,
    canApproveListings: true,
    canRejectListings: true,
    canCreateListing: false,
    canManageRoles: false,
    canManageAuthorityRecords: false
  },
  SYSTEM_ADMIN: {
    canViewAllData: true,
    canManageUsers: true,
    canManageListings: true,
    canManageRoles: true,
    canManageAuthorityRecords: true,
    canOverrideDecisions: true,
    canAuditAdminActions: true,
    canAccessDashboard: true,
    canViewAnalytics: true,
    canDeleteListings: true,
    canSuspendUsers: true,
    canViewAuditLogs: true,
    canModifySystemSettings: true
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `This action requires one of these roles: ${allowedRoles.join(', ')}. Your role: ${userRole}`
      });
    }

    next();
  };
};

/**
 * Middleware to check specific permission
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const userPermissions = rolePermissions[userRole] || {};

    if (!userPermissions[permission]) {
      return res.status(403).json({
        success: false,
        message: `You don't have permission to perform this action. Required permission: ${permission}`
      });
    }

    next();
  };
};

/**
 * Get all permissions for a role
 */
export const getPermissionsByRole = (role) => {
  return rolePermissions[role] || {};
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (userRole, permission) => {
  const permissions = rolePermissions[userRole] || {};
  return permissions[permission] || false;
};

/**
 * Get available roles
 */
export const getAvailableRoles = () => {
  return Object.keys(rolePermissions);
};

/**
 * Export role permissions for frontend
 */
export const getRolePermissions = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const userRole = req.user.role;
  const permissions = rolePermissions[userRole] || {};

  res.status(200).json({
    success: true,
    userRole,
    permissions
  });
};

export default {
  rolePermissions,
  requireRole,
  requirePermission,
  getPermissionsByRole,
  hasPermission,
  getAvailableRoles
};
