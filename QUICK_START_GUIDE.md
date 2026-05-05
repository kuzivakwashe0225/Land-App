# 🚀 QUICK START GUIDE - Land Solutions Platform

## ⚡ 5-Minute Setup

### 1. Install Dependencies
```bash
# Terminal 1: Server setup
cd server
npm install

# Terminal 2: Client setup
cd client
npm install
```

### 2. Start MongoDB
```bash
# If local MongoDB:
mongod

# OR use MongoDB Atlas (update MONGODB_URI in .env)
```

### 3. Configure Environment
```bash
# Create server/.env
MONGODB_URI=mongodb://localhost:27017/landsolutions
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
JWT_SECRET=your-secret-key-here
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### 4. Seed Database
```bash
# Terminal in server directory
node scripts/seed-harare-stands.js
node scripts/seed-authority-records-real-data.js
```

### 5. Start Services
```bash
# Terminal 1: Server (from server directory)
npm run dev

# Terminal 2: Client (from client directory)
npm run dev

# App opens at http://localhost:3000
```

---

## 🧪 Quick Testing (10 Minutes)

### Run Unit Tests
```bash
# From server directory
npm test -- stands-verification.test.js

# Expected: 20+ tests pass
```

### Test All User Roles

**1. Create Test Accounts**
```
Email              Role                  Password
───────────────────────────────────────────────────
buyer@test.com     BUYER                 Test@1234
seller@test.com    SELLER                Test@1234
officer@test.com   VERIFICATION_OFFICER  Test@1234
admin@test.com     SYSTEM_ADMIN          Test@1234
```

**2. Test BUYER Flow**
- Sign in as buyer@test.com
- Navigate to `/lands`
- Should see verified listings only
- Try to access `/create-land-listing`
- Should be redirected (403)

**3. Test SELLER Flow**
- Sign in as seller@test.com
- Click "Create Land Listing"
- Enter:
  - Stand Number: HARARE-BOR-001
  - Title Deed: TD-2021-009876
  - Zoning: RESIDENTIAL
  - Size: 1000 sqm
  - Price: 50000 USD
- Click "Find on Map"
- Pin at Borrowdale (-17.8233, 31.0340)
- Submit
- Should show: "Verification pending"

**4. Test OFFICER Flow**
- Sign in as officer@test.com
- Navigate to `/verify-land`
- Should see pending listings
- Click on seller's listing
- Review documents
- Click "Approve"
- Listing becomes VERIFIED

**5. Test ADMIN Flow**
- Sign in as admin@test.com
- Navigate to `/admin`
- Access: Manage Users, View Reports, System Settings
- All should work

---

## 📚 Comprehensive Testing (30 Minutes)

Follow **TESTING_GUIDE.md** for full test suite:

```bash
# Run all tests
npm test

# Manual testing checklist (documented)
# See TESTING_GUIDE.md for step-by-step
```

---

## 🔍 Verify System Health

### Check Database
```bash
# Connect to MongoDB
mongosh

# Run queries
use landsolutions
db.stands.countDocuments()                    # Should be 20+
db.authority_records.countDocuments()         # Should be 14+
db.users.countDocuments()                     # Should be 0+ (after seeding)
db.lands.countDocuments()                     # Should be 0+ (after testing)
```

### Check API Health
```bash
# In new terminal
curl http://localhost:5000/api/land/analytics

# Should return JSON with statistics
```

### View Logs
```bash
# Server logs in terminal 1 should show:
✓ MongoDB connected
✓ Server running on port 5000
✓ Routes registered
```

---

## 📊 Key Features to Test

### ✅ Email Verification
```
1. Sign up
2. Check email (or console for dev mode)
3. Click verification link
4. Should redirect to sign in
```

### ✅ GPS Validation
```
1. Create listing
2. Click "Find on Map"
3. Pin location DIFFERENT from Borrowdale
4. System should warn: "You are Xkm from this location"
```

### ✅ Zoning Compliance
```
1. Try RESIDENTIAL zoning on commercial stand
2. System should flag: "Zoning mismatch"
```

### ✅ Flag Abuse Prevention
```
1. As BUYER, flag a listing
2. Try to flag same listing again
3. Should show: "Already flagged"
4. Try to flag 4 times in 24h
5. Should show: "Daily limit reached"
```

### ✅ Lifecycle Management
```
1. As SELLER, create listing (Status: DRAFT)
2. Edit listing (should work)
3. Officer approves (Status: VERIFIED)
4. Try to edit (should show "Request Edit")
5. Click "Mark Sold"
6. Listing hidden from public
```

---

## 🎯 Test Data Summary

### Available Stands in Database
```
Harare (RESIDENTIAL):
  HARARE-BOR-001  : -17.8233, 31.0340 (VACANT)
  HARARE-BOR-002  : -17.8245, 31.0350 (VACANT)
  HARARE-BOR-003  : -17.8210, 31.0330 (ALLOCATED)

Harare (COMMERCIAL):
  HARARE-AVON-001 : -17.8412, 31.0445 (VACANT)
  HARARE-AVON-002 : -17.8425, 31.0455 (VACANT)

Harare (BUSINESS DISTRICT):
  HARARE-BD-001   : -17.8280, 31.0470 (VACANT)
  HARARE-BD-002   : -17.8295, 31.0485 (VACANT)

[+ 13 more stands in various suburbs]
```

### Authority Records Available
```
Stand Number: 2456
Owner: Tendai Moyo
National ID: 63-245678Z45
Title Deed: TD-2021-009876
GPS: -17.8233, 31.0340

[+ 13 more authority records]
```

---

## 📱 Application Flows

### Buyer Journey
```
Sign Up → Email Verification → Sign In
→ Browse Listings → View Details → Contact Seller
→ Save Listing → Report Suspicious
```

### Seller Journey
```
Sign Up → Email Verification → Sign In
→ Create Listing → Enter Coordinates → Upload Docs
→ Submit → Pending Verification
→ (Officer Verifies) → Listing Approved
→ Mark as Sold / Withdraw
```

### Officer Journey
```
Sign In → /verify-land → View Queue
→ Review Documents → Approve/Reject
→ Handle Fraud Flags → Resolve as Valid/False Alarm
```

### Admin Journey
```
Sign In → /admin → Manage Users
→ View Reports → Configure Settings
→ Monitor Analytics
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
mongosh

# If error: Check MONGODB_URI in .env
# Update if using MongoDB Atlas:
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/landsolutions
```

### Port Already in Use
```bash
# If port 5000 is taken:
# Option 1: Kill process
lsof -i :5000
kill -9 <PID>

# Option 2: Change PORT in .env
PORT=5001
```

### Email Not Sending
```bash
# In development, emails print to console
# Check server terminal for email content

# For production, set real email credentials in .env
# Use Gmail app password (not account password)
```

### Tests Failing
```bash
# Clear test database
mongosh
use landsolutions-test
db.dropDatabase()

# Re-run tests
npm test -- stands-verification.test.js
```

---

## ✨ Success Indicators

When everything works correctly, you should see:

```
✓ Server running on port 5000
✓ Client running on port 3000
✓ MongoDB connected (20+ stands loaded)
✓ Email verification working
✓ All 5 roles accessible
✓ Map loads with real coordinates
✓ Listings created successfully
✓ Verification process working
✓ Tests passing
```

---

## 📖 Next Steps

1. **Explore Documentation**
   - Read TESTING_GUIDE.md for comprehensive testing
   - Check RBAC_AND_PERMISSIONS.md for role details
   - Review PRODUCTION_READINESS_CHECKLIST.md

2. **Run Full Test Suite**
   - Follow TESTING_GUIDE.md
   - Test all 5 user roles
   - Verify all features working

3. **Deploy to Production**
   - Follow deployment checklist
   - Set up monitoring
   - Configure backups

---

## 🆘 Need Help?

**Check Documentation:**
- TESTING_GUIDE.md - How to test every feature
- RBAC_AND_PERMISSIONS.md - What each role can do
- PRODUCTION_READINESS_CHECKLIST.md - System status
- OPTION_3_REAL_MAP_DATA_GUIDE.md - Map data details

**Common Questions:**

Q: Can BUYER create listings?
A: No, only SELLER role. BUYER is read-only.

Q: Can SELLER verify own listings?
A: No, must be VERIFICATION_OFFICER or above.

Q: What coordinates should I use?
A: Use any from loaded stands (see Test Data Summary above).

Q: How do I get test accounts?
A: Create via sign-up at http://localhost:3000/sign-up

---

## 📊 Performance Benchmarks

Expected performance on modern hardware:

```
Database Queries:      < 50ms average
API Responses:         < 200ms average
Page Load:             < 2 seconds
Map Rendering:         < 1 second
Listing Search:        < 100ms
```

---

**Ready to go! 🚀**

Start with:
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev

# Open: http://localhost:3000
```

**Happy testing! 🎉**

