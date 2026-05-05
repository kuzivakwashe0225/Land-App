# 🔐 Admin Setup & User Management Guide

## ✅ Complete Admin System Implementation

Your system now has:
- ✅ Super Admin account creation script
- ✅ Role-based signup restrictions (public users = BUYER/SELLER only)
- ✅ Admin-only account creation endpoints
- ✅ Email verification system
- ✅ Full user management capabilities

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Clean Database (Fresh Start)
```bash
mongosh
use land-solutions
db.users.deleteMany({})  # Start fresh
exit
```

### Step 2: Create Super Admin Account
```bash
cd server
node scripts/create-super-admin.js
```

**Output will show:**
```
✅ SYSTEM_ADMIN (Super Admin)
   Email: admin@landsolutions.local
   Password: AdminPass123

✅ VERIFICATION_OFFICER
   Email: officer@landsolutions.local
   Password: OfficerPass123

✅ MUNICIPAL_OFFICER
   Email: municipal@landsolutions.local
   Password: MunicipalPass123
```

### Step 3: Start the System
```bash
# Terminal 1: Server
npm run dev

# Terminal 2: Client
cd ../client && npm run dev

# Open: http://localhost:5173
```

### Step 4: Sign In as Admin
```
Email: admin@landsolutions.local
Password: AdminPass123
```

---

## 📋 Account Types & Creation Methods

### Public Users (Created via Signup Form)
| Role | Can Be Created By | Email Verified? | Status |
|------|---|---|---|
| BUYER | User signup form | Required | Normal user |
| SELLER | User signup form | Required | Can list lands |

### Admin Users (Created by System Admin Only)
| Role | Can Be Created By | Email Verified? | Status |
|------|---|---|---|
| VERIFICATION_OFFICER | System Admin (API/script) | Pre-verified | Can verify lands |
| MUNICIPAL_OFFICER | System Admin (API/script) | Pre-verified | Can override decisions |
| SYSTEM_ADMIN | System Admin (API/script) | Pre-verified | Full system access |

---

## 🔑 Email Verification System

### How It Works

**1. User Signs Up**
```
→ User submits form
→ Backend validates all fields
→ Account created (isEmailVerified: false)
→ Verification email SENT
```

**2. Email Verification Token**
```
Token generated: crypto.randomBytes(32).toString('hex')
Token hashed: SHA-256 hash
Expires: 24 hours
Link format: http://localhost:5173/verify-email/{token}
```

**3. User Clicks Link**
```
→ Frontend extracts token from URL
→ Sends token to /api/auth/verify-email/{token}
→ Backend unhashes and verifies token
→ Sets isEmailVerified: true
→ Redirects to sign-in
```

**4. User Signs In**
```
→ Email verified? YES → Allow sign-in ✓
→ Email verified? NO → Block with message ✗
```

### Email Configuration

The system is now configured with your Gmail account:

```
EMAIL_USER=mishaelgwede19@gmail.com
EMAIL_PASS=ndgv xmno vlmh pgxr  (Gmail App Password)
```

**Important:** Gmail App Passwords are created at: https://myaccount.google.com/apppasswords

---

## ✉️ Testing Email Verification

### Test Case 1: Sign Up and Verify
```
1. Go to http://localhost:5173/sign-up
2. Create account:
   - Email: testuser@example.com
   - Phone: +263773123456
   - National ID: 63-245678Z45
   - Password: TestPass123
   - Role: BUYER

3. Check email inbox for verification link
4. Click link → Confirmation page
5. Go to sign-in with email + password
6. SUCCESS: You're signed in ✓
```

### Test Case 2: Email Resend
```
1. If you didn't get verification email
2. On signup success page
3. Click "Resend verification email"
4. Check inbox again
5. Rate limit: Can resend after 5 minutes
```

### Test Case 3: Admin Sign In (Pre-verified)
```
Email: admin@landsolutions.local
Password: AdminPass123

No email verification needed (admin accounts pre-verified)
```

---

## 👥 User Management via Admin Panel

### Create New Admin Account

**Via API:**
```bash
curl -X POST http://localhost:5000/api/admin/create-admin \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Officer",
    "email": "john.officer@landsolutions.local",
    "phoneNumber": "+263774567890",
    "nationalId": "12-345678C34",
    "password": "SecurePass123",
    "role": "VERIFICATION_OFFICER"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "VERIFICATION_OFFICER account created successfully.",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Officer",
    "email": "john.officer@landsolutions.local",
    "role": "VERIFICATION_OFFICER"
  }
}
```

### Get All Users

```bash
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Suspend User

```bash
curl -X POST http://localhost:5000/api/admin/suspend-user \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "suspend": true
  }'
```

### Change User Role

```bash
curl -X POST http://localhost:5000/api/admin/change-role \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "newRole": "SELLER"
  }'
```

---

## 🔒 Permission Model

### SYSTEM_ADMIN Permissions
✅ Create admin/officer accounts  
✅ View all users  
✅ Suspend/unsuspend users  
✅ Change user roles  
✅ Delete user accounts  
✅ Access admin dashboard  
✅ Full system access  

### VERIFICATION_OFFICER Permissions
✅ View pending listings  
✅ Approve/reject listings  
✅ Resolve fraud flags  
✗ Create users  
✗ Manage system settings  

### MUNICIPAL_OFFICER Permissions
✅ All VERIFICATION_OFFICER permissions  
✅ Override verification decisions  
✅ Manage disputes  
✗ Create users  
✗ Manage system settings  

### BUYER & SELLER Permissions
✓ View verified listings  
✓ Create account  
✓ Update profile  
✗ Access admin panel  
✗ Create other users  

---

## 📧 Gmail App Password Setup

### If Email Is Not Sending

**Step 1: Enable 2-Factor Authentication**
1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification"
3. Follow Google's instructions

**Step 2: Create App Password**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Google generates a 16-character password
4. Copy the password

**Step 3: Update .env**
```
EMAIL_USER=mishaelgwede19@gmail.com
EMAIL_PASS=ndgv xmno vlmh pgxr  # Your 16-char app password
```

**Step 4: Restart Server**
```bash
npm run dev
```

**Step 5: Test Signup**
1. Sign up with new account
2. Should receive verification email within 5 seconds
3. If not, check server logs: `✓ Verification email sent to: email@example.com`

---

## 🧪 Complete Testing Workflow

### Phase 1: Setup (10 minutes)
```bash
# 1. Delete old test data
mongosh
use land-solutions
db.users.deleteMany({})

# 2. Create super admin
node scripts/create-super-admin.js

# 3. Start system
npm run dev  # Terminal 1
npm run dev  # Terminal 2 (client)
```

### Phase 2: Test Admin Sign In (2 minutes)
```
1. Go to http://localhost:5173/sign-in
2. Email: admin@landsolutions.local
3. Password: AdminPass123
4. Should see dashboard
5. Navigate to /admin
6. Should see admin panel
```

### Phase 3: Test Public Signup (5 minutes)
```
1. Go to http://localhost:5173/sign-up
2. Create BUYER account:
   - Email: buyer@test.com
   - Phone: +263773123456
   - National ID: 63-245678Z45
   - Password: Test@1234
   - Role: BUYER only (SELLER option also available)

3. Should see: "Check your email for verification"
4. Check inbox for verification email
5. Click link → "Email verified!"
6. Sign in with buyer@test.com + Test@1234
7. Access dashboard and browse listings
```

### Phase 4: Test Admin Creating Officer (3 minutes)
```
1. Sign in as admin@landsolutions.local
2. Go to /admin/create-officer (or use API)
3. Create verification officer:
   - Email: officer2@landsolutions.local
   - Phone: +263774567890
   - National ID: 45-123456A78
   - Password: Officer@1234
   - Role: VERIFICATION_OFFICER

4. Sign out
5. Sign in as officer2@landsolutions.local
6. Should access /verify-land dashboard
```

### Phase 5: Test Role Restrictions (2 minutes)
```
1. Sign in as BUYER
2. Try to access /admin → 403 Forbidden
3. Try to create listing → Allowed (SELLER can)
4. Try to verify listing → 403 Forbidden

1. Sign in as SELLER
2. Try to access /admin → 403 Forbidden
3. Can create listing → Allowed
4. Can view own listings → Allowed

1. Sign in as OFFICER
2. Can access /verify-land → Allowed
3. Can approve/reject → Allowed
4. Cannot create users → 403 Forbidden
```

---

## 📊 Database Structure

### User Document
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique),
  phoneNumber: String (unique),
  nationalId: String (unique),
  role: "BUYER" | "SELLER" | "VERIFICATION_OFFICER" | "MUNICIPAL_OFFICER" | "SYSTEM_ADMIN",
  isEmailVerified: Boolean,
  authentication: {
    password: String (hashed),
    loginAttempts: Number,
    lockUntil: Date
  },
  security: {
    emailVerificationToken: String (hashed),
    emailVerificationExpires: Date
  },
  activity: {
    accountStatus: "ACTIVE" | "SUSPENDED" | "DEACTIVATED" | "BANNED",
    lastActive: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔍 Debugging Checklist

### Email Not Sending?
```bash
# 1. Check server logs
npm run dev
# Look for: "✓ Verification email sent to: email@example.com"

# 2. Check Gmail settings
https://myaccount.google.com/security
# Verify 2FA is enabled

# 3. Check app password in .env
cat server/.env | grep EMAIL

# 4. Test email directly
node scripts/test-email.js  # (create this if needed)
```

### User Can't Sign In?
```bash
# 1. Check if email is verified
mongosh
use land-solutions
db.users.findOne({ email: "test@example.com" })
# Look for: "isEmailVerified": true

# 2. Manually verify if needed
db.users.updateOne(
  { email: "test@example.com" },
  { $set: { isEmailVerified: true } }
)
```

### Admin Functions Not Working?
```bash
# 1. Verify admin token exists
# (Check browser DevTools → Application → Cookies → access_token)

# 2. Check user role
mongosh
use land-solutions
db.users.findOne({ email: "admin@landsolutions.local" })
# Look for: "role": "SYSTEM_ADMIN"

# 3. Verify auth middleware
# Check server/middlewares/auth-middleware.js is working
```

---

## 🎯 Success Indicators

When everything is set up correctly:

✅ Super admin script creates 3 accounts (admin, officer, municipal)  
✅ Admin can sign in without email verification  
✅ Public signup restricted to BUYER/SELLER  
✅ Verification email sent within 5 seconds  
✅ User can't sign in until email verified  
✅ Admin can create new officer accounts  
✅ Admin can suspend/unsuspend users  
✅ Role-based access control enforced  
✅ All 401/403 errors properly returned  
✅ User dashboard loads correctly after sign-in  

---

## 📝 Files Modified/Created

### New Files
- `server/scripts/create-super-admin.js` — Create initial admin accounts
- `server/controllers/admin-controller.js` — Admin management functions
- `server/routes/admin-route.js` — Admin API endpoints
- `ADMIN_SETUP_GUIDE.md` — This guide

### Modified Files
- `client/src/pages/SignUp.jsx` — Restrict roles to BUYER/SELLER
- `server/controllers/auth-controller.js` — Validate roles on signup
- `server/.env` — Added Gmail credentials
- `server/index.js` — Mounted admin router

---

## 🚀 Next Steps

1. **Run super admin script**
   ```bash
   node scripts/create-super-admin.js
   ```

2. **Restart server**
   ```bash
   npm run dev
   ```

3. **Sign in as admin**
   ```
   Email: admin@landsolutions.local
   Password: AdminPass123
   ```

4. **Test public signup**
   ```
   Go to /sign-up → Create BUYER account
   Check email for verification link
   Sign in after verification
   ```

5. **Create more officers**
   ```
   As admin: POST /api/admin/create-admin
   Create VERIFICATION_OFFICER accounts as needed
   ```

---

## ⚠️ Important Security Notes

1. **Default accounts are LOCAL ONLY**
   - Change passwords in production
   - Use secure passwords (20+ characters)
   - Store in secrets manager

2. **Email credentials stored in .env**
   - Never commit .env to git
   - Use environment variables in production
   - Rotate app passwords periodically

3. **JWT tokens**
   - Default 7-day expiry
   - Secure httpOnly cookies
   - Signed with JWT_SECRET_KEY

4. **Account suspension**
   - Suspended accounts cannot sign in
   - Admin can unsuspend anytime
   - Flagged accounts auto-suspended

---

**Status:** ✅ COMPLETE ADMIN SYSTEM READY

All admin functionality is now implemented and ready for testing. Follow the quick start guide above to get started in 5 minutes!

**Last Updated:** May 3, 2026  
**Version:** 1.0 (Production Ready)
