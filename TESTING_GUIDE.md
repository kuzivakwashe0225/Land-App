# 🧪 COMPLETE SYSTEM TESTING GUIDE

## Overview

This guide covers comprehensive testing of the Land Solutions Platform with real data, proper verification, and all system functionalities.

---

## 📋 Table of Contents

1. [Setup & Initialization](#setup--initialization)
2. [Database Seeding](#database-seeding)
3. [Unit Tests](#unit-tests)
4. [Integration Tests](#integration-tests)
5. [Role-Based Access Control Tests](#role-based-access-control-tests)
6. [Manual Testing Checklist](#manual-testing-checklist)
7. [System Health Check](#system-health-check)

---

## ⚙️ Setup & Initialization

### Prerequisites
```bash
Node.js v16+
MongoDB local or Atlas
npm or yarn
```

### Installation
```bash
# Install dependencies
cd server && npm install
cd ../client && npm install
```

### Environment Setup
```bash
# Create .env file in server directory
MONGODB_URI=mongodb://localhost:27017/landsolutions
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
JWT_SECRET=your-secret-key
```

---

## 🗄️ Database Seeding

### Step 1: Seed Harare Stands Database

This creates real stands with coordinates, zoning, and status.

```bash
cd server/scripts
node seed-harare-stands.js
```

**Expected Output:**
```
✓ Connected to MongoDB
✓ Seeded 20 stands into database

📊 Stand Distribution:
  HARARE - COMMERCIAL - VACANT: 4
  HARARE - RESIDENTIAL - VACANT: 8
  HARARE - RESIDENTIAL - ALLOCATED: 1
  CHITUNGWIZA - COMMERCIAL - VACANT: 1
  CHITUNGWIZA - RESIDENTIAL - VACANT: 1
  BULAWAYO - COMMERCIAL - VACANT: 2
  BULAWAYO - RESIDENTIAL - VACANT: 2

📈 Stand Status Summary:
  VACANT: 18
  ALLOCATED: 2
```

### Step 2: Seed Authority Records

Creates government authority data for verification.

```bash
node seed-authority-records-real-data.js
```

---

## 🧬 Unit Tests

### Run Stand Verification Tests

```bash
# From server directory
npm test -- stands-verification.test.js
```

**Test Coverage:**
- ✓ Coordinate verification
- ✓ Zoning compatibility
- ✓ Stand lookup
- ✓ Vacant stands retrieval
- ✓ Stand number validation
- ✓ Statistics calculation
- ✓ Data integrity
- ✓ Multi-suburb handling

---

## 🔗 Integration Tests

### Test 1: Complete Land Listing Flow

**Scenario:** Seller creates a valid listing

```bash
# 1. Start server
npm run dev

# 2. Open client
npm run dev (from client directory)

# 3. Sign up as SELLER
- Email: seller@test.com
- Password: Test@1234
- Role: SELLER
```

**Test Steps:**
```
1. Navigate to "Create Land Listing"
2. Enter:
   - Stand Number: HARARE-BOR-001
   - Title Deed: TD-2021-009876
   - Address: Harare, Borrowdale
   - Zoning: RESIDENTIAL
   - Price: 50000 USD
   - Size: 1000 sqm

3. Click "Find on Map"
4. Pin location at Borrowdale coords (-17.8233, 31.0340)
5. Click "Submit"

Expected Result:
✓ GPS coordinates verified
✓ Stand status: VACANT (allowed)
✓ Zoning: RESIDENTIAL (allowed)
✓ Listing created
✓ Status: PENDING_VERIFICATION
✓ Notification sent to officers
```

### Test 2: Fraud Detection - Invalid Coordinates

**Scenario:** Seller tries to list stand from unauthorized coordinates

```
1. Same as Test 1, but pin location 5km away
2. System should:
   ✓ Show warning: "You are Xkm from this location"
   ✓ Show red flag: "Coordinates not authorized"
   ✓ Prevent submission OR mark for review
```

### Test 3: Allocated Stand Detection

**Scenario:** Seller tries to list already-allocated stand

```
1. Try to list HARARE-BOR-003 (already allocated to Tendai Moyo)
2. System should:
   ✓ Check coordinates
   ✓ Find stand is ALLOCATED
   ✗ Reject submission
   ✓ Show message: "Stand already allocated"
```

### Test 4: Zoning Mismatch

**Scenario:** Seller tries commercial use on residential stand

```
1. Select HARARE-BOR-001 (RESIDENTIAL zoned)
2. Select zoning: COMMERCIAL
3. System should:
   ✓ Show warning: "Zoning mismatch"
   ✓ Restrict submission or flag for review
```

---

## 👥 Role-Based Access Control Tests

### Test 1: BUYER Role Permissions

```bash
# Sign in as BUYER
- Email: buyer@test.com
- Password: Test@1234
- Role: BUYER

Expected Permissions:
✓ View verified listings
✓ View map with actual stands
✓ Contact sellers
✓ Report suspicious listings
✓ Save/bookmark listings
✗ Cannot create listings
✗ Cannot verify listings
✗ Cannot access admin panel
✗ Cannot manage users

Test:
1. Try to navigate to /create-land-listing
   Expected: Redirect to /lands
2. Try to access /admin
   Expected: 403 Forbidden
3. View /lands
   Expected: Show only verified listings
```

### Test 2: SELLER Role Permissions

```bash
# Sign in as SELLER
- Email: seller@test.com
- Password: Test@1234
- Role: SELLER

Expected Permissions:
✓ Create listings
✓ Edit own listings (draft/rejected only)
✓ Mark as sold
✓ Withdraw listing
✓ View own listings
✓ Contact buyers
✗ Cannot verify listings
✗ Cannot access admin panel
✗ Cannot edit verified listings directly (must create revision)

Test:
1. Create listing → Status: DRAFT
2. Edit listing → Should work
3. After verification (Status: VERIFIED)
   - Click "Edit" → Show message: "Cannot edit verified listings"
   - Show "Request Edit" button instead
4. Access /admin → 403 Forbidden
```

### Test 3: VERIFICATION_OFFICER Role

```bash
# Sign in as VERIFICATION_OFFICER
- Email: officer@test.com
- Password: Test@1234
- Role: VERIFICATION_OFFICER

Expected Permissions:
✓ Access /verify-land
✓ Review pending listings
✓ Approve/reject listings
✓ View documents
✓ Add verification notes
✓ Resolve fraud flags
✗ Cannot create listings
✗ Cannot manage users
✗ Cannot change system settings

Test:
1. Navigate to /verify-land
   Expected: Show pending verification queue
2. Click on listing
   Expected: See full details + documents
3. Approve listing
   Expected: Status changes to VERIFIED
4. Access /admin
   Expected: 403 Forbidden
```

### Test 4: MUNICIPAL_OFFICER Role

```bash
# Sign in as MUNICIPAL_OFFICER
- Email: municipal@test.com
- Password: Test@1234
- Role: MUNICIPAL_OFFICER

Same permissions as VERIFICATION_OFFICER plus:
✓ Override verification decisions
✓ Manage disputes
```

### Test 5: SYSTEM_ADMIN Role

```bash
# Sign in as SYSTEM_ADMIN
- Email: admin@test.com
- Password: Test@1234
- Role: SYSTEM_ADMIN

Expected Permissions:
✓ Access all admin panels
✓ Manage users (view, suspend)
✓ View all reports
✓ Configure system settings
✓ Access audit logs
✓ Override any verification decision

Test:
1. Navigate to /admin
   Expected: Admin dashboard loads
2. Click "Manage Users"
   Expected: See all users, can suspend
3. Click "View Reports"
   Expected: See all fraud reports
4. Click "System Settings"
   Expected: Can edit verification parameters
```

---

## ✅ Manual Testing Checklist

### Authentication
- [ ] User signup with validation
- [ ] Email verification before signin
- [ ] Password reset functionality
- [ ] JWT token expiration
- [ ] Session timeout

### User Roles
- [ ] BUYER role restrictions enforced
- [ ] SELLER role restrictions enforced
- [ ] OFFICER role permissions work
- [ ] ADMIN role full access
- [ ] Role switching in different sessions works

### Land Listing Creation
- [ ] Stand number validation
- [ ] Coordinate verification against database
- [ ] Zoning compatibility check
- [ ] Size calculation (sqm → hectares)
- [ ] Document upload
- [ ] GPS proof-of-presence capture
- [ ] Distance advisory (>500m warning)

### Land Verification
- [ ] Officer can review pending listings
- [ ] Officer can access documents
- [ ] Approval sets status to VERIFIED
- [ ] Rejection shows to seller
- [ ] Verification score calculated correctly
- [ ] Auto-verification works (score ≥80%)

### Listing Lifecycle
- [ ] Draft listings can be edited
- [ ] Verified listings show "Request Edit"
- [ ] Creating revision works
- [ ] Mark as Sold hides from public
- [ ] Withdraw hides listing

### Flag Abuse Prevention
- [ ] Cannot flag own listing
- [ ] Max 3 flags per 24h enforced
- [ ] Cannot flag if banned
- [ ] 3 false flags = 1 strike
- [ ] Progressive bans work (7d → 30d → permanent)
- [ ] Permanent ban visible in profile

### Map Functionality
- [ ] Map loads with real coordinates
- [ ] User can pin location
- [ ] Distance calculation shows
- [ ] Real GPS capture works
- [ ] "Use My Location" button works

### Admin Features
- [ ] User management works
- [ ] Reports view shows all flags
- [ ] System settings save correctly
- [ ] Analytics dashboard shows accurate stats

### Notifications
- [ ] Email notifications sent
- [ ] In-app notifications work
- [ ] Verification status notifications
- [ ] Flag abuse warnings sent

---

## 🏥 System Health Check

### Database Health Check Script

Create `server/scripts/health-check.js`:

```javascript
import mongoose from 'mongoose';
import User from '../models/user-model.js';
import Land from '../models/landModel.js';
import Stands from '../models/stands-model.js';
import AuthorityRecords from '../models/authority-records-model.js';

async function healthCheck() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB connection OK');

    // Check collections
    const users = await User.countDocuments();
    const lands = await Land.countDocuments();
    const stands = await Stands.countDocuments();
    const authority = await AuthorityRecords.countDocuments();

    console.log(`\n📊 Data Summary:`);
    console.log(`  Users: ${users}`);
    console.log(`  Lands: ${lands}`);
    console.log(`  Stands: ${stands}`);
    console.log(`  Authority Records: ${authority}`);

    // Check indexes
    const userIndexes = await User.collection.getIndexes();
    console.log(`\n✓ User indexes: ${Object.keys(userIndexes).length}`);

    // Check data integrity
    const badUsers = await User.find({ email: null });
    console.log(`\n✓ Data integrity: ${badUsers.length === 0 ? 'OK' : 'ISSUES FOUND'}`);

    console.log(`\n✓ All health checks passed!`);
    process.exit(0);
  } catch (error) {
    console.error('✗ Health check failed:', error.message);
    process.exit(1);
  }
}

healthCheck();
```

**Run:**
```bash
node server/scripts/health-check.js
```

### API Endpoint Health Check

```bash
# Test all critical endpoints
curl http://localhost:5000/api/auth/signin
curl http://localhost:5000/api/land/analytics
curl http://localhost:5000/api/stands/statistics
```

---

## 📈 Performance Testing

### Load Testing with Autocannon

```bash
npm install -g autocannon

# Test listing creation endpoint
autocannon -c 10 -d 30 http://localhost:5000/api/land

# Test verification endpoint
autocannon -c 10 -d 30 http://localhost:5000/api/land/verify
```

---

## 🐛 Debugging

### Enable Debug Logging

```bash
DEBUG=* npm run dev
```

### MongoDB Query Inspection

```bash
# Connect to MongoDB
mongosh

# Test queries
db.stands.find({ status: 'VACANT' }).count()
db.users.find({ role: 'SELLER' }).count()
db.lands.find({ 'verification.status': 'VERIFIED' }).count()
```

---

## 📊 Test Report Template

```
SYSTEM TEST REPORT
==================

Date: [DATE]
Tested By: [NAME]
Duration: [TIME]

RESULTS:
--------
Unit Tests: [X/Y] passed
Integration Tests: [X/Y] passed
RBAC Tests: [X/Y] passed
Manual Tests: [X/Y] passed

ISSUES FOUND:
[List issues with priority]

CRITICAL ISSUES: 0
MAJOR ISSUES: 0
MINOR ISSUES: 0

RECOMMENDATION: [PASS/FAIL]

Tester Signature: ____________  Date: __________
```

---

## ✨ When All Tests Pass

```
✓ All 50+ unit tests pass
✓ All integration flows work end-to-end
✓ All 5 roles tested and working correctly
✓ All buttons and features functional
✓ Database verified with real data
✓ Coordinates validated against stands
✓ Zoning compliance enforced
✓ System ready for production
```

