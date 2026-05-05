# Testing Guide: Land Listing Creation Without KYC

## Quick Test Scenario

### Test 1: Create Listing Without KYC (Seller Role)

**Setup:**
1. Log in as a SELLER user (who hasn't completed KYC)
2. Go to Dashboard

**Expected State:**
- Dashboard loads
- Stats show all 7 stands with correct counts
- "New Listing" button is available and clickable
- "KYC Verification" button is visible but available (not locked)

**Steps:**
1. Click "New Listing" button
2. Fill in property details:
   - Stand Number: `TEST-STAND-001`
   - Title Deed: `TD-2026-999999`
   - Price: `75000` USD
   - Size: `600` sqm
   - Suburb: `HARARE`
   - Zoning: `RESIDENTIAL`
   - Street: `14 Test Road, Harare`
3. Click "Create Listing"

**Expected Result:**
✅ Listing created successfully (NO KYC error)
✅ Message: "Land listing created successfully" or similar
✅ Status: **PENDING**
✅ Redirects to land detail page
✅ No error about "KYC verification required"

---

### Test 2: Verify Automated Verification Runs

**After listing is created:**

1. Wait 30 seconds for automated verification to complete
2. Go to Dashboard → "Browse Stands" or navigate to `/lands`
3. Search for the listing you just created

**Expected Result:**
- Listing appears in results (if verification score ≥ 75%)
- OR listing is marked as PENDING_VERIFICATION (if score 50-74%)
- OR listing is marked as FLAGGED (if score < 50% or fraud detected)

**Check verification status:**
- Go to land detail page
- Look for "Verification Status" section
- Should show the automated verification result

---

### Test 3: Check Fraud Detection (Multiple Listings)

**If you want to test fraud detection:**

1. Create 5 listings in rapid succession (within 2 minutes)
2. 5th listing should trigger fraud flag

**Expected Result:**
- Listing still creates (no blocking)
- Status: **FLAGGED** or **SUSPENDED**
- Message: "Land listing created but flagged for review due to suspicious activity"
- Verification Officer receives notification

---

### Test 4: Dashboard Stat Cards Are Clickable

**On Dashboard:**

1. Click "Total Listings" card (top left)
   - Should navigate to `/lands?view=all`
   - Should show all listings

2. Click "Verified" card
   - Should navigate to `/lands?status=VERIFIED`
   - Should show only verified listings

3. Click "Buyer Inquiries" card
   - Should navigate to `/transactions`
   - Should show buyer inquiries for your listings

4. Click "Messages" card
   - Should navigate to `/messages`
   - Should show conversation list

---

### Test 5: Role-Based Feature Locking

**Log in as different users and check Dashboard:**

#### As SELLER:
- ✅ "New Listing" - AVAILABLE (blue button)
- ✅ "Browse Stands" - AVAILABLE
- ✅ "KYC Verification" - AVAILABLE
- ✅ "Messages" - AVAILABLE
- ✅ "My Active Listings" section - SHOWN

#### As BUYER:
- 🔒 "New Listing" - LOCKED (gray, lock icon, "Only sellers can create listings")
- ✅ "Browse Stands" - AVAILABLE
- 🔒 "KYC Verification" - LOCKED (gray, lock icon, "KYC is for sellers only")
- ✅ "Messages" - AVAILABLE
- ℹ️ "My Active Listings" section - HIDDEN (shows "Seller Feature" message instead)

#### As VERIFICATION_OFFICER or MUNICIPAL_OFFICER:
- 🔒 "New Listing" - LOCKED
- ✅ "Browse Stands" - AVAILABLE
- 🔒 "KYC Verification" - LOCKED
- ✅ "Messages" - AVAILABLE
- ℹ️ "My Active Listings" section - HIDDEN
- ✅ Additional "Verify Land Listings" section appears (if implemented)

---

## Expected Errors (Intentional)

These errors mean the system is working correctly:

### ❌ Duplicate Stand Number
```
Error: "This stand number or title deed is already listed."
Reason: Same stand/deed created twice
Solution: Use different stand number
```

### ❌ Out of Bounds Coordinates
```
Error: "Coordinates must be within Zimbabwe boundaries"
Reason: GPS coordinates outside Zimbabwe
Solution: Use valid Zimbabwe coordinates (-22.4 to -8.3 lat, 24.5 to 34.3 lng)
```

### ⚠️ Listing Flagged
```
Message: "Land listing created but flagged for review due to suspicious activity"
Reason: Fraud detection triggered (5+ listings, duplicate coordinates, etc.)
What happens: Verification Officer reviews manually
```

---

## Success Indicators

After completing all tests, you should see:

1. ✅ **Listings created without KYC requirement**
2. ✅ **Automatic verification runs immediately**
3. ✅ **Verification score assigned (0-100%)**
4. ✅ **Listing status updates based on score**
5. ✅ **Dashboard shows correct system-wide statistics**
6. ✅ **Clickable stat cards filter results correctly**
7. ✅ **Role-based features show/lock appropriately**
8. ✅ **Fraud detection flags suspicious activity**
9. ✅ **No KYC error blocks listing creation**
10. ✅ **Officers receive notifications for flagged listings**

---

## Troubleshooting

### Issue: Still getting "KYC verification required" error

**Solution:**
1. Clear browser cache
2. Stop and restart the development server
3. Check that `landController.js` lines 29-31 have the KYC comment
4. Verify `reportedBy: null` is used instead of `reportedBy: 'SYSTEM'`

### Issue: Listing created but doesn't appear in search

**Possible reasons:**
- Verification score is below 75% (pending manual review)
- Listing is flagged for suspicious activity
- You're logged in as BUYER (buyers only see VERIFIED listings)

**Solution:**
- Log in as ADMIN to see all listings
- Check listing detail page to see verification status
- Wait for Officer to manually approve if PENDING_VERIFICATION

### Issue: Dashboard shows 0 listings

**Solution:**
1. Check that `/api/dashboard/public-stats` endpoint exists
2. Verify `dashboard-route.js` is imported in main server file
3. Clear browser cache and refresh
4. Check browser console for fetch errors

### Issue: Coordinates not validating

**Solution:**
1. Use these test coordinates (valid Zimbabwe):
   - Harare center: `-17.8252, 31.0335`
   - Bulawayo: `-20.1500, 28.5833`
   - Chitungwiza: `-17.9600, 31.0700`

---

## Database Checks (Optional)

If testing via MongoDB:

```javascript
// See all created listings
db.lands.find().pretty()

// See verification status breakdown
db.lands.aggregate([
  { $group: { _id: '$verification.status', count: { $sum: 1 } } }
])

// See fraudFlags
db.lands.find({ 'fraudFlags.0': { $exists: true } }).pretty()

// See pending verifications
db.lands.find({ 'verification.status': 'PENDING_VERIFICATION' }).pretty()
```

---

## Key Files to Monitor

While testing, watch these files for errors:

1. **Browser Console** (`F12` → Console tab)
   - Fetch errors from API calls
   - React warnings

2. **Server Console** (terminal where server runs)
   - Backend error logs
   - Verification service debug output
   - Database query errors

3. **Network Tab** (`F12` → Network tab)
   - POST /api/land/create
   - GET /api/dashboard/public-stats
   - GET /api/land (for listing retrieval)

---

## Next Steps After Testing

If all tests pass:
1. ✅ System is ready for production
2. ✅ Users can create listings immediately
3. ✅ Verification system automatically validates properties
4. ✅ Officers can manually review flagged listings
5. ✅ Buyers see only verified properties

If tests fail:
1. Check error messages in console
2. Review troubleshooting section
3. Check that recent code changes were saved
4. Restart development server

