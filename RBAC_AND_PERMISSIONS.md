# 🔐 ROLE-BASED ACCESS CONTROL & PERMISSIONS

## System Overview

This document specifies the complete RBAC (Role-Based Access Control) matrix for the Land Solutions Platform.

---

## 🎭 Defined Roles

| Role | Code | Purpose | Level |
|------|------|---------|-------|
| Buyer | `BUYER` | Browse & purchase land | User |
| Seller | `SELLER` | List & sell land | User |
| Verification Officer | `VERIFICATION_OFFICER` | Verify listings | Officer |
| Municipal Officer | `MUNICIPAL_OFFICER` | Manage disputes & compliance | Officer |
| System Administrator | `SYSTEM_ADMIN` | System management | Admin |

---

## 🔍 Detailed Permission Matrix

### BUYER Role

**Capabilities:**
```
✓ Authentication
  - Sign up with email verification
  - Sign in
  - Change password
  - View profile
  - Update profile

✓ Land Browsing
  - View all verified listings
  - View listing details
  - Search listings by suburb/zoning/price
  - Filter listings
  - View map with stand coordinates
  - View seller public information

✓ Interaction
  - Contact seller (messaging)
  - Save/bookmark listings
  - Report suspicious listings
  - View transaction history
  - View flag history (own submissions)

✗ Restricted Actions
  ✗ Cannot create listings
  ✗ Cannot edit any listing
  ✗ Cannot delete listings
  ✗ Cannot verify listings
  ✗ Cannot approve/reject
  ✗ Cannot manage users
  ✗ Cannot access admin panel
  ✗ Cannot view unverified listings
```

**Routes Protected:**
```
GET    /lands                    ✓ (verified only)
GET    /lands/:id               ✓
POST   /report-fraud            ✓
GET    /dashboard               ✓ (buyer dashboard)
GET    /messages                ✓
GET    /profile                 ✓
```

**Routes Denied:**
```
POST   /create-land-listing     ✗ 403 Forbidden
PUT    /update-land/:id         ✗ 403 Forbidden
DELETE /land/:id                ✗ 403 Forbidden
POST   /verify-land             ✗ 403 Forbidden
GET    /admin                   ✗ 403 Forbidden
```

---

### SELLER Role

**Capabilities:**
```
✓ Authentication
  - All buyer authentication rights
  - Personal KYC verification
  - Account status tracking

✓ Land Management
  - Create new listings (status: draft)
  - View own listings
  - Edit own listings (draft/pending_verification/rejected only)
  - Upload supporting documents
  - Capture GPS proof-of-presence
  - Submit for verification

✓ Listing Lifecycle
  - Withdraw listing (soft delete)
  - Mark listing as sold
  - Create revision of verified listing
  - Track verification progress
  - View verification feedback

✓ Interaction
  - All buyer interaction rights
  - Respond to buyer inquiries
  - View interested buyers
  - Manage listing inquiries

✓ Reporting
  - View own flag history
  - See compliance requirements
  - Track flag abuse strikes

✗ Restricted Actions
  ✗ Cannot verify any listing (including own)
  ✗ Cannot edit verified listings directly
  ✗ Cannot approve own verification
  ✗ Cannot access admin features
  ✗ Cannot see other sellers' listings (private)
  ✗ Cannot manage users
  ✗ Cannot override verification decisions
```

**Routes Protected:**
```
POST   /create-land-listing           ✓
PUT    /update-land/:id               ✓ (own listing only)
DELETE /land/:id                      ✓ (withdraw)
POST   /land/:id/mark-sold            ✓
POST   /land/:id/create-revision      ✓
GET    /verify-seller-details         ✓
GET    /dashboard                     ✓ (seller dashboard)
```

**Routes Denied:**
```
POST   /verify-land                   ✗ 403
GET    /admin                         ✗ 403
PUT    /land/:otherId                 ✗ 403 (not own)
POST   /land/verify                   ✗ 403 (can't verify own)
```

---

### VERIFICATION_OFFICER Role

**Capabilities:**
```
✓ Verification
  - Access verification queue
  - Review pending listings
  - View seller documents
  - View authority record matches
  - View GPS validation results
  - View fraud flags
  - Approve listing (set to VERIFIED)
  - Reject listing (with feedback)
  - Request more information

✓ Fraud Management
  - View all fraud flags
  - Investigate suspected fraud
  - Resolve fraud flags (VALID/FALSE_ALARM)
  - See impact of decisions on reporters
  - Add investigation notes

✓ Reports
  - View fraud report statistics
  - Generate compliance reports
  - Track approval rates

✓ Notifications
  - Receive verification requests
  - Receive flag escalations
  - Send notifications to sellers/buyers

✗ Restricted Actions
  ✗ Cannot create listings
  ✗ Cannot edit listings
  ✗ Cannot delete listings
  ✗ Cannot manage system users
  ✗ Cannot access system settings
  ✗ Cannot override municipal officer decisions
  ✗ Cannot view admin analytics
  ✗ Cannot change verification rules
```

**Routes Protected:**
```
GET    /verify-land                  ✓ (pending queue)
GET    /verify-land/:id              ✓ (details)
POST   /verify-land/:id/approve      ✓
POST   /verify-land/:id/reject       ✓
GET    /verify-land/documents        ✓
POST   /flag/:id/resolve             ✓
GET    /reports                      ✓ (officer view)
```

**Routes Denied:**
```
POST   /create-land-listing          ✗ 403
POST   /admin/users                  ✗ 403
POST   /admin/settings               ✗ 403
DELETE /land/:id                     ✗ 403
GET    /admin/analytics              ✗ 403
```

---

### MUNICIPAL_OFFICER Role

**Capabilities:**
```
✓ All VERIFICATION_OFFICER capabilities

✓ Additional Capabilities
  - Override verification decisions
  - Manage ownership disputes
  - Create/update compliance requirements
  - Set building restrictions per stand
  - Manage stand allocations
  - Issue stop-work orders
  - Create compliance violations

✓ Authority Management
  - Update authority records
  - Manage stand database
  - Set zoning requirements
  - Create special regulations

✓ Administrative
  - Access broader analytics
  - Generate compliance reports
  - Create audit logs
  - Manage contractor blacklists

✗ Restricted Actions
  ✗ Cannot suspend user accounts (system admin only)
  ✗ Cannot manage system users
  ✗ Cannot change core system settings
  ✗ Cannot delete data (hard delete)
```

**Routes Protected:**
```
All VERIFICATION_OFFICER routes + :
POST   /verify-land/:id/override      ✓
POST   /disputes/:id/manage           ✓
POST   /compliance/violations         ✓
PUT    /authority-records             ✓
GET    /analytics                     ✓ (extended)
```

---

### SYSTEM_ADMIN Role

**Capabilities:**
```
✓ Full System Access
  - All officer capabilities
  - User management (create, read, update, suspend)
  - System settings configuration
  - Database administration
  - Backup and recovery
  - Audit log access
  - System monitoring

✓ User Management
  - View all users
  - Create system accounts
  - Suspend/unsuspend accounts
  - Reset passwords
  - Change user roles
  - View user activity

✓ Configuration
  - Modify verification parameters
  - Set verification thresholds
  - Configure email settings
  - Manage API keys
  - Set rate limits
  - Configure file upload limits
  - Set system-wide restrictions

✓ Monitoring
  - View system health
  - Monitor performance metrics
  - Access error logs
  - Track security events
  - Generate compliance reports
  - Export data

✓ Overrides
  - Override any verification decision
  - Override any flag resolution
  - Force approval/rejection
  - Modify user account status
  - Delete sensitive data (with audit)

✗ Restricted Actions
  ✗ Cannot be bypassed by any system rule
  ✗ All actions logged to audit trail
```

**Routes Protected:**
```
GET    /admin                        ✓
GET    /admin/users                  ✓
POST   /admin/users/:id/suspend      ✓
PUT    /admin/users/:id              ✓
GET    /admin/reports                ✓
POST   /admin/settings               ✓
GET    /admin/logs                   ✓
GET    /admin/analytics              ✓
DELETE /admin/data/:type             ✓ (with audit)
POST   /admin/override/:id           ✓
```

---

## 🔄 Cross-Role Interactions

### Buyer → Seller
- Can view seller's public information
- Can message seller
- Cannot see seller's other listings
- Cannot access seller's documents

### Seller → Officer
- Officer can view seller's documents
- Officer can contact seller
- Officer can see seller's KYC status
- Seller cannot see verification process

### Officer → Admin
- Admin can override officer decisions
- Admin can view officer activity
- Admin can reconsider officer rejections

---

## 🚨 Permission Enforcement

### Backend Middleware

```javascript
// Authenticate first
authenticateToken(req, res, next) {
  // Verify JWT token
  // Attach user to req.user
  // If no token → 401 Unauthorized
}

// Then authorize by role
authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

// Then check specific permissions
verifyOwnership(req, res, next) {
  // Check req.user._id === resource.owner
  // If not → 403 Forbidden
}

verifyStatus(req, res, next) {
  // Check resource.status allows this action
  // If not → 400 Bad Request
}
```

### Frontend Routing

```javascript
// Public routes
<Route path="/signin" element={<SignIn />} />
<Route path="/sign-up" element={<SignUp />} />

// Authenticated routes (all logged-in users)
<Route element={<PrivateRoute />}>
  <Route path="/lands" element={<LandListings />} />
  <Route path="/dashboard" element={<Dashboard />} />
</Route>

// Role-specific routes
<Route element={<RoleBasedRoute allowedRoles={['SELLER']} />}>
  <Route path="/create-land-listing" element={<CreateLandListing />} />
</Route>

<Route element={<RoleBasedRoute allowedRoles={['VERIFICATION_OFFICER', 'MUNICIPAL_OFFICER']} />}>
  <Route path="/verify-land" element={<VerificationCenter />} />
</Route>

<Route element={<RoleBasedRoute allowedRoles={['SYSTEM_ADMIN']} />}>
  <Route path="/admin" element={<AdminDashboard />} />
</Route>
```

---

## 📊 Permission Summary Table

| Action | Buyer | Seller | Officer | Municipal | Admin |
|--------|-------|--------|---------|-----------|-------|
| View verified listings | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create listing | ✗ | ✓ | ✗ | ✗ | ✓ |
| Edit own listing | ✗ | ✓* | ✗ | ✗ | ✓ |
| Verify listing | ✗ | ✗ | ✓ | ✓ | ✓ |
| Resolve flags | ✗ | ✗ | ✓ | ✓ | ✓ |
| Manage users | ✗ | ✗ | ✗ | ✗ | ✓ |
| System settings | ✗ | ✗ | ✗ | ✗ | ✓ |
| View reports | ✗ | ✗ | ✓ | ✓ | ✓ |
| Override decisions | ✗ | ✗ | ✗ | ✓ | ✓ |
| View audit logs | ✗ | ✗ | ✗ | ✗ | ✓ |

*Seller can edit draft/pending/rejected, not verified

---

## 🔐 Security Considerations

### Token Validation
- All requests with user actions require valid JWT
- Token expiry enforced (24-hour default)
- Token refresh via re-authentication

### Data Isolation
- Sellers cannot see other sellers' private data
- Buyers see only verified, public listings
- Officers see verification-relevant data only

### Audit Trail
- All admin actions logged
- Permission changes tracked
- Sensitive operations flagged

### Rate Limiting
- Flag submissions: 3 per 24h
- Listing creation: 5 per 24h (sellers)
- Login attempts: 5 per 15min

---

## ✅ Testing RBAC

### Unit Tests
```bash
npm test -- rbac-tests.js
```

### Manual Testing Checklist
- [ ] BUYER cannot access SELLER features
- [ ] SELLER cannot verify own listings
- [ ] OFFICER cannot manage users
- [ ] ADMIN can override any decision
- [ ] All routes enforce authentication
- [ ] All actions logged properly

---

## 📈 Role Distribution in Production

```
Expected User Base:
- Buyers: 60%
- Sellers: 30%
- Officers: 7%
- Municipal: 2%
- Admin: 1%
```

---

## 🔄 Role Transition Rules

### Allowed Role Changes
- BUYER → SELLER (profile upgrade)
- BUYER → SELLER + VERIFICATION_OFFICER (for staff)
- Any role → SYSTEM_ADMIN (IT team only)

### Prevented Changes
- Cannot remove SYSTEM_ADMIN role (requires deletion)
- Cannot change role of higher-level admin
- All role changes require audit logging

---

**Document Version:** 1.0  
**Last Updated:** May 3, 2026  
**Status:** APPROVED FOR PRODUCTION  

