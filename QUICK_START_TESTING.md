# Land Solutions Platform - Quick Start Testing Guide

## 🚀 Prerequisites

```bash
# Install Node.js (v16+) and MongoDB (local instance)
node --version   # Should be v16+
mongod --version # Should be installed
```

## 📦 Installation & Setup

### 1. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables

Create `.env` file in `server/` directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/land-solutions

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# JWT
JWT_SECRET_KEY=your_jwt_secret_key_change_this

# External APIs (optional - uses mock data in development)
DEEDS_OFFICE_API_URL=https://api.example.com/deeds
DEEDS_OFFICE_API_KEY=your_api_key
MUNICIPAL_API_URL=https://api.example.com/municipal
MUNICIPAL_API_KEY=your_api_key

# Firebase (for document uploads - optional)
FIREBASE_API_KEY=your_firebase_key
FIREBASE_AUTH_DOMAIN=your-firebase.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### 3. Start MongoDB

```bash
# Windows
mongod

# Or if using Docker
docker run -d -p 27017:27017 --name mongodb mongo
```

### 4. Start the Application

```bash
# Terminal 1: Start backend server
cd server
npm start
# Should print: "🚀 Server is running on port 5000"

# Terminal 2: Start frontend dev server
cd client
npm run dev
# Should print: "VITE v... Local: http://localhost:5173/"
```

## ✅ Verification: System Objectives

### Objective 1: Verify Legitimacy & Authenticate Ownership

**Test KYC Requirement:**

```
1. Open http://localhost:5173 in browser
2. Click "Sign Up"
3. Register as SELLER:
   - First Name: Test
   - Last Name: Seller
   - Email: testseller@example.com
   - Phone: +263781234567
   - National ID: 12-1234567A89
   - Password: TestPassword123!
   - Role: SELLER
4. Click "Create Land Listing"
5. Try to create listing - should see error:
   "KYC verification is required. Current status: NOT_SUBMITTED"

6. Go to "Submit KYC"
7. Upload documents:
   - National ID photo
   - Proof of address
   - Selfie
8. Submit KYC (status changes to PENDING)
9. Log in as ADMIN and approve KYC
10. Now seller can create listings ✅
```

**Test Duplicate Detection:**

```
1. As seller, create land listing:
   - Stand Number: UNIQUE123
   - Title Deed: TD-2024-123
   - Price: $50,000
   - Size: 500 sqm
   - Click "Set Location on Map"
   - Select location
   - Submit

2. Try to create another listing with same stand number
3. Should see error: "Stand number or title deed number already exists" ✅
```

**Test Coordinate Validation:**

```
1. Try to create listing with invalid coordinates:
   - Latitude: -35.000 (outside Zimbabwe)
   - Longitude: 30.000
2. Should see error: "Coordinates must be within Zimbabwe boundaries" ✅
```

---

### Objective 2: View Physical Location & Verify GPS Coordinates

**Test Interactive Map:**

```
1. Create Land Listing
2. Scroll to "Location Information" section
3. Click blue button "Click Here to Set Location on Map"
4. Interactive map opens (centered on Harare)
5. Click anywhere on map
6. Coordinates auto-populate in Latitude/Longitude fields
7. Map shows selected marker
8. Click "Done" button
9. Modal closes, coordinates are set ✅
```

**Test Map on Detail Page:**

```
1. Create a verified land listing (admin: create with VERIFIED status)
2. Go to Land Listings
3. Click on the land
4. Scroll down to "Location on Map" section
5. Interactive map shows with:
   - Green marker (verified)
   - Latitude and Longitude displayed
   - Can zoom and pan on map ✅
```

---

### Objective 3: Detect & Flag Suspicious Listings

**Test Rapid Listing Detection:**

```
1. Create 5+ land listings rapidly (same day)
2. 5th+ listing should show message:
   "Land listing created but flagged for review due to suspicious activity"
3. Listing status: FLAGGED
4. Verification status: SUSPENDED
5. Admin sees flagged listing in dashboard ✅
```

**Test Fraud Reporting:**

```
1. Go to "Report Fraudulent Activity" page
2. Fill in fraud report:
   - Stand Number: SUSPICIOUS_STAND
   - Type of Fraud: Fake Documents
   - Description: This listing has fake title deeds
3. Submit report
4. Should see: "Fraud report submitted successfully"
5. Check admin dashboard - report appears in list
6. Admin can click on report to view details
7. Admin can update status: UNDER_REVIEW → RESOLVED ✅
```

---

### Objective 4: Centralized Admin Dashboard for Transparency

**Test Verification Center:**

```
1. Log in as SYSTEM_ADMIN
2. Go to "Verification Center" (or find in navigation)
3. Should see:
   - Total Land Listings count
   - Verified Listings count
   - Pending User KYC count
   - Tab for "Land Listings" and "User KYC"
4. Click "Land Listings" tab
5. See all pending lands
6. Find a pending land
7. Click "Approve" button
8. Land status changes to VERIFIED ✅
```

**Test Admin Dashboard:**

```
1. Log in as SYSTEM_ADMIN
2. Go to "Admin Dashboard"
3. Should see metrics:
   - Total Users
   - Total Lands
   - Pending Verifications
   - Fraud Reports
   - Monthly Transactions
4. Metrics should update in real-time ✅
```

---

## 🧪 Automated Testing

### Run Test Suite

```bash
# Install test dependencies
npm install --save-dev axios

# Run comprehensive tests
node TEST_SUITE.js
```

**Expected Output:**
```
✅ PASSED: Test 1.1 - KYC Requirement
✅ PASSED: Test 1.2 - Duplicate Detection
✅ PASSED: Test 2.1 - Coordinate Validation
✅ PASSED: Test 2.2 - Map Display
... (more tests)

🎯 Success Rate: 95%+
```

---

## 🗺️ Map Testing Checklist

### CreateLandListing Map Tests

- [ ] Map button appears in Location Information section
- [ ] Click button opens modal dialog
- [ ] Map is centered on Zimbabwe (Harare)
- [ ] Can see map controls (zoom, pan)
- [ ] Click on map sets coordinates
- [ ] Latitude/Longitude fields auto-populate
- [ ] Coordinates display with 6 decimal places
- [ ] "Done" button closes modal
- [ ] Coordinates persist after modal closes
- [ ] Cannot manually edit Lat/Lng (read-only)

### LandDetail Map Tests

- [ ] Land detail page shows "Location on Map" section
- [ ] Map component displays correctly
- [ ] Marker shows on correct coordinates
- [ ] Marker color matches verification status:
  - Green = Verified
  - Yellow = Pending
  - Red = Flagged/Suspicious
- [ ] Latitude/Longitude shown below map
- [ ] Can zoom/pan on detail page map
- [ ] Map responsive on mobile

### Public Map View (All Lands)

- [ ] Lands page shows map view option
- [ ] All verified stands show as green markers
- [ ] Can click marker to see details
- [ ] Filter lands by suburb - map updates
- [ ] Filter lands by price - map updates
- [ ] Show/hide boundaries option works

---

## 🔐 Security Testing

### Authentication Tests

```
1. Try to access protected routes without login
   - GET /api/land (should fail with 401)
   - POST /api/land (should fail with 401)
   - GET /api/reports (should fail with 401)

2. Try to verify land as buyer
   - Should fail with 403 (forbidden)

3. Try to use fake/expired token
   - Should fail with 401
```

### Data Validation Tests

```
1. Submit form with missing required fields
   - Stand Number: empty
   - Should fail validation

2. Submit form with invalid Zimbabwean phone number
   - Phone: +1-555-1234
   - Should fail validation

3. Submit form with invalid national ID format
   - National ID: ABC123
   - Should fail validation
   - Expected format: XX-XXXXXXXAXX
```

### Authorization Tests

```
1. Seller A tries to update Seller B's listing
   - Should fail with 403

2. Seller tries to verify own land
   - Should fail with 403 (not authorized role)

3. Buyer tries to create land listing
   - Should fail with 403 (seller role required)
```

---

## 📊 Testing Forms & Routes

### Land Listing Form

```
❌ Missing Stand Number
❌ Missing Title Deed
❌ Missing Price
❌ Missing Size
❌ Invalid Suburb (not in enum)
❌ Invalid Coordinates (outside Zimbabwe)
❌ Negative price
❌ Zero size

✅ All fields filled correctly
✅ Optional documents uploaded
✅ Location set from map
```

### Routes Testing

```
GET  /api/land?suburb=HARARE      ✅ Filter by suburb
GET  /api/land?minPrice=10000     ✅ Price filter
GET  /api/land?verified=true      ✅ Verified filter
GET  /api/land?page=2&limit=20    ✅ Pagination
POST /api/land                    ✅ Create new land
GET  /api/land/:landId            ✅ Get land details
PUT  /api/land/:landId            ✅ Update land
POST /api/land/:landId/verify     ✅ Verify land (admin)
POST /api/land/:landId/flag       ✅ Flag as suspicious
GET  /api/land/search?q=STAND123  ✅ Search lands
GET  /api/land/analytics          ✅ Analytics (admin)
```

---

## 🐛 Common Issues & Fixes

### Issue: "Failed to fetch land details"
**Solution:**
```
1. Check MongoDB is running
2. Check API server is running on port 5000
3. Check token is valid in localStorage
4. Check browser console for errors
```

### Issue: "Map not showing"
**Solution:**
```
1. Check Leaflet CSS is loaded:
   - Open DevTools → Network
   - Should see leaflet.css loaded
2. Check GISMap component is imported correctly
3. Clear browser cache
4. Check that land has valid coordinates
```

### Issue: "Cannot create listing - KYC error"
**Solution:**
```
1. Go to Submit KYC page
2. Upload all required documents
3. Verify documents are clear photos
4. Submit KYC
5. Wait for admin approval
6. Check notification when approved
7. Try creating listing again
```

### Issue: "Coordinates not updating from map"
**Solution:**
```
1. Make sure you clicked on the map (not just opened it)
2. Check browser console for JavaScript errors
3. Try refreshing page and trying again
4. Check that Leaflet.js is loaded
```

---

## 📝 Test Data

### Test Users Created After Running Setup:

**Admin User:**
```
Email: admin@landsolutions.com
Password: AdminPassword123!
Role: SYSTEM_ADMIN
```

**Test Seller:**
```
Email: testseller@example.com
Password: TestPassword123!
Role: SELLER
KYC Status: PENDING (until admin approves)
```

**Test Buyer:**
```
Email: testbuyer@example.com
Password: TestPassword123!
Role: BUYER
KYC Status: APPROVED
```

### Test Land Data:

```
Stand HARARE001: -17.825, 31.033 (Central Harare)
Stand HARARE002: -17.820, 31.040 (East Harare)
Stand BULAWAYO001: -20.145, 28.583 (Bulawayo)
Stand CHITUNGWIZA001: -18.010, 31.085 (Chitungwiza)
```

---

## 🎯 Success Criteria

### All objectives met when:

✅ Sellers must complete KYC before listing
✅ Stand numbers cannot be duplicated
✅ Coordinates must be within Zimbabwe
✅ Interactive map available in listing creation
✅ Map shows on land detail page
✅ Fraud reports can be submitted
✅ Fraudulent listings are automatically flagged
✅ Admin can see and manage all pending items
✅ All routes properly protected
✅ All forms validate correctly
✅ Test suite runs with 95%+ success rate

---

## 📞 Support

If you encounter issues:

1. Check the IMPLEMENTATION_SUMMARY.md for detailed explanations
2. Check TEST_PLAN.md for comprehensive test cases
3. Review ERRORS in browser console
4. Check server logs for backend errors
5. Verify all prerequisites are installed

**Good luck testing! 🚀**
