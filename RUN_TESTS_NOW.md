# RUN TESTS NOW - Quick Start Commands

## ⚡ 5-MINUTE QUICK TEST

### Step 1: Start Everything (3 terminals)

```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start Server
cd server
npm install  # if needed
npm start

# Terminal 3: Start Client
cd client
npm install  # if needed
npm run dev
```

**Wait for:**
- MongoDB: "listening on port 27017"
- Server: "🚀 Server is running on port 5000"
- Client: "VITE v... ready in X ms"

### Step 2: Open Browser

```
http://localhost:5173
```

You should see: Land Solutions Platform homepage

---

## 🧪 TEST DATA - Use These Exact Values

### For Sellers Creating Listings

```
SELLER 1:
  Stand Number: A123
  Title Deed: TD-2024-001
  Owner: John Doe
  National ID: 12-1234567A89
  Suburb: HARARE
  Latitude: -17.825
  Longitude: 31.033
  Price: $50,000
  Size: 500 sqm

SELLER 2:
  Stand Number: B456
  Title Deed: TD-2024-002
  Owner: Jane Smith
  National ID: 23-7654321B90
  Suburb: BULAWAYO
  Latitude: -20.145
  Longitude: 28.583
  Price: $45,000
  Size: 450 sqm

SELLER 3 (Test Fraudulent):
  Stand Number: FRAUDULENT-001
  Title Deed: DISPUTED-001
  Suburb: HARARE
  Latitude: -17.825
  Longitude: 31.033
  (This should be REJECTED)
```

### For Admins Approving

```
ADMIN LOGIN:
  Email: admin@landsolutions.com
  Password: AdminPassword123!
  (Create if doesn't exist)
```

---

## ✅ TEST WORKFLOW - Step by Step

### Test 1: Register & KYC (5 minutes)

```
1. Click "Sign Up"
2. Fill form:
   First Name: Test
   Last Name: Seller
   Email: testseller123@example.com
   Phone: +263781234567
   National ID: 12-1234567A89
   Password: TestPassword123!
   Role: SELLER

3. Click "Create Account"

4. Go to "Submit KYC"
5. Upload documents (can use any image files)
6. Click "Submit KYC"

✅ STATUS: KYC PENDING

7. Log out

8. Log in as ADMIN
   Email: admin@landsolutions.com
   (Create if doesn't exist)

9. Go to "Verification Center"
10. Click "User KYC" tab
11. Find "Test Seller"
12. Click "Approve"

✅ STATUS: KYC APPROVED
```

### Test 2: Create Land Listing (10 minutes)

```
1. Log in as seller (testseller123@example.com)

2. Go to "Create Land Listing"

3. Fill "Basic Information":
   - Stand Number: A123
   - Title Deed Number: TD-2024-001
   - Price: 50000
   - Land Size: 500

4. Fill "Location Information":
   - Street Address: Test Street
   - Suburb: HARARE
   - Province: HARARE
   
5. CLICK "Click Here to Set Location on Map" ⭐
   - Map opens
   - Click on map center
   - Coordinates auto-fill
   - Click "Done"

6. Fill "Land Details":
   - Zoning: RESIDENTIAL
   - Land Use: VACANT

7. Upload Documents (optional):
   - Click "Upload documents"
   - Select any files

8. Click "Create Listing"

✅ STATUS: LISTING CREATED
✅ Now in PENDING verification status
```

### Test 3: Admin Verification (10 minutes)

```
1. Log in as ADMIN

2. Go to "Verification Center"
3. Click "Land Listings" tab
4. Find "Stand A123"

5. CLICK "Verify" Button ⭐
   - System runs 7-point check
   - Wait for report...
   
6. Review Verification Report:
   ✅ Deeds Office Match
   ✅ Municipal Records
   ✅ Ownership Match
   ✅ Coordinates Valid
   ✅ No Encumbrances
   ✅ No Disputes
   ✅ Rates Cleared
   Score: 92%

7. Click "Approve" ⭐
8. (Optional) Add admin notes
9. Click "Confirm Approval"

✅ STATUS: VERIFIED & AVAILABLE
```

### Test 4: Buyer Sees Listing (5 minutes)

```
1. Log out

2. Log in as BUYER
   Email: buyer@example.com
   (Create if needed)

3. Go to "Land Listings"

4. Should see "Stand A123" in list
   - Status: VERIFIED ✅
   - Price: $50,000
   - Size: 500 sqm
   - Owner: Test Seller

5. Click on listing

6. See "Location on Map" section
   - Interactive map shows
   - Green marker (verified)
   - Coordinates: -17.825, 31.033

✅ SUCCESS: Listing visible to buyer with map!
```

---

## 🧪 AUTOMATED TEST SUITE

### Run All Tests at Once

```bash
cd server
npm install axios  # if needed
node ../TEST_SUITE.js
```

**Expected Output:**
```
🧪 Testing: KYC Requirement
✅ PASSED: KYC Requirement

🧪 Testing: Duplicate Detection  
✅ PASSED: Duplicate Detection

... (more tests)

✅ Passed: 18
❌ Failed: 2
🎯 Success Rate: 90%
```

---

## 🚨 IF TESTS FAIL - Quick Fixes

### "Cannot create listing - KYC error"
```
✅ FIX:
1. Admin must approve KYC first
2. Seller must log out and back in
3. Try again
```

### "Map not showing"
```
✅ FIX:
1. Clear browser cache: Ctrl+Shift+Delete
2. Refresh: Ctrl+R
3. Try again
```

### "Coordinates outside boundary"
```
✅ FIX:
1. Use test data coordinates
2. Harare: -17.825, 31.033 ✅
3. Bulawayo: -20.145, 28.583 ✅
```

### "Verification score too low"
```
✅ FIX:
1. Use test data (A123, TD-2024-001, John Doe)
2. These are known good data
3. Should score 92%
```

### "Server error"
```
✅ FIX:
1. Check MongoDB is running: mongod
2. Restart server: npm start
3. Check console for errors
4. Look at VERIFICATION_TESTING_GUIDE.md
```

---

## 📊 WHAT TO EXPECT

### Successful Seller Flow:
```
Register → KYC Pending → Admin Approves KYC → 
Can Create Listing → Listing Pending → Admin Verifies → 
Listing Approved → Visible to Buyers ✅
```

### Successful Admin Verification:
```
See Pending Stand → Click Verify → 
7-Point Check Runs → Get Report (Score %) → 
Approve or Reject → Seller Notified ✅
```

### Successful Buyer Experience:
```
See Verified Listings → Click Stand → 
View Details → See Map with Location → 
See Coordinates → Can Contact Seller ✅
```

---

## ✅ SUCCESS INDICATORS

### You'll know it's working when:

✅ **Registration**
- Sign up form works
- Email/phone validation works
- Account created successfully

✅ **KYC**
- Can submit documents
- Admin can approve
- Seller can list after approval

✅ **Land Listing**
- Can fill form
- Map modal opens
- Coordinates auto-populate
- Can submit listing

✅ **Verification**
- Pending stand shows in verification center
- Verify button works
- Report generates with score
- Can approve/reject

✅ **Map**
- Interactive map shows on creation
- Map shows on detail page
- Coordinates display
- Can zoom/pan

✅ **Buyer View**
- Only verified listings shown
- Map visible with location
- Stand details clear
- Can report if suspicious

---

## 🎯 TESTING CHECKLIST

### Day 1: Core Functions
- [ ] Registration works
- [ ] KYC submission works
- [ ] Admin KYC approval works
- [ ] Cannot list without KYC approved
- [ ] Can list after KYC approved

### Day 2: Verification
- [ ] Verification button works
- [ ] 7-point check executes
- [ ] Score calculates correctly
- [ ] Approve button works
- [ ] Reject button works
- [ ] Seller receives notification

### Day 3: Maps
- [ ] Map modal opens
- [ ] Click on map sets coordinates
- [ ] Coordinates auto-populate
- [ ] Map shows on detail page
- [ ] Green marker appears

### Day 4: Edge Cases
- [ ] Duplicate stand rejected
- [ ] Invalid coordinates rejected
- [ ] Form validation works
- [ ] Routes protected (401/403)
- [ ] Errors handled gracefully

### Day 5: Admin Dashboard
- [ ] Can see all stats
- [ ] Can see pending items
- [ ] Can filter by suburb
- [ ] Analytics work
- [ ] Fraud reports visible

---

## 🔍 VERIFICATION CHECKLIST

When verifying a stand, check:

```
Stand A123:
✅ Deeds Office - TD-2024-001 found
✅ Municipal - A123 registered in Harare
✅ Ownership - John Doe matches deed
✅ Coordinates - Within Harare bounds
✅ No Encumbrances - Clear to sell
✅ No Disputes - No court cases
✅ Rates - All paid

SCORE: 92% → APPROVE ✅
```

---

## 📱 BROWSER TESTING TIPS

### Clear Cache Frequently
```
Ctrl+Shift+Delete (Windows/Linux)
Cmd+Shift+Delete (Mac)
Clear cached files, cookies, and storage
Reload page
```

### Check Console for Errors
```
F12 to open Developer Tools
Go to "Console" tab
Look for red error messages
Check "Network" tab for failed requests
```

### Test on Multiple Browsers
```
✅ Chrome
✅ Firefox
✅ Edge
✅ Safari (if Mac)
```

---

## 🎓 LEARNING RESOURCES

Inside repository:

1. **IMPLEMENTATION_SUMMARY.md** - Full technical details
2. **ADMIN_VERIFICATION_GUIDE.md** - Admin workflows explained
3. **VERIFICATION_TESTING_GUIDE.md** - Detailed testing guide
4. **DEPLOYMENT_READY_SUMMARY.md** - Deployment instructions

---

## 📞 TROUBLESHOOTING

**Problem: "Cannot connect to server"**
```
Check:
1. Is MongoDB running? (mongod in terminal)
2. Is server started? (npm start in server folder)
3. Is port 5000 available?
Try: Restart server
```

**Problem: "API returns 404"**
```
Check:
1. Did you register verification router?
2. Is endpoint URL spelled correctly?
3. Check server console for errors
Try: Restart server
```

**Problem: "Database connection failed"**
```
Check:
1. Is MongoDB running?
2. Is connection string correct in .env?
3. Is database file in right location?
Try: mongod && npm start
```

---

## 🚀 NOW YOU'RE READY!

```
1. Start services:
   mongod
   npm start (server)
   npm run dev (client)

2. Open browser:
   http://localhost:5173

3. Test the flow:
   Register → KYC → List → Verify → Approve → View on Map

4. Run automated tests:
   node TEST_SUITE.js

5. Follow guides:
   ADMIN_VERIFICATION_GUIDE.md
   VERIFICATION_TESTING_GUIDE.md
```

---

## ✨ HAVE FUN! 

You now have a complete stand authentication and verification system for Zimbabwe's real estate market.

**Go forth and reduce housing fraud! 🇿🇼**

---

**Need help?** → Check guides above
**Found a bug?** → Check VERIFICATION_TESTING_GUIDE.md troubleshooting
**Ready to deploy?** → Check DEPLOYMENT_READY_SUMMARY.md

**Happy testing! 🎉**
