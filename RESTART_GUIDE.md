# Complete System Restart & Cleanup Guide

Follow these steps to completely clean and restart the system:

## Step 1: Stop All Processes

If you have any servers/dev servers running, stop them:
- Press `Ctrl+C` in terminal windows running npm/node processes
- Wait 2-3 seconds for graceful shutdown

## Step 2: Clear Browser Data

### Chrome/Chromium:
1. Press `Ctrl+Shift+Delete` (or Command+Shift+Delete on Mac)
2. Select "All time" in the time range
3. Check:
   - ✓ Cookies and other site data
   - ✓ Cached images and files
4. Click "Clear data"
5. Close the browser completely
6. Reopen the browser

### Firefox:
1. Press `Ctrl+Shift+Delete` 
2. Select "Everything"
3. Click "Clear Now"
4. Close and reopen browser

### Safari:
1. Menu → "History" → "Clear History"
2. Select "all history"
3. Click "Clear History"

## Step 3: Clean Node Modules (Optional but recommended)

If you're having persistent issues:

```bash
# In the client directory
cd client
rm -rf node_modules package-lock.json
npm install

# In the server directory  
cd ../server
rm -rf node_modules package-lock.json
npm install
```

## Step 4: Start the Backend Server

Open **Terminal 1** and run:

```bash
cd server
npm start
```

Expected output:
```
✅ Database Connection Successful.
🚀 Server running on http://localhost:5000
```

**Wait for this message before proceeding!**

## Step 5: Start the Frontend Dev Server

Open **Terminal 2** and run:

```bash
cd client
npm run dev
```

Expected output:
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

## Step 6: Test the Login Flow

1. **Open browser** at `http://localhost:5173`
2. **Sign in** with test credentials:

```
Email: seller@landsolutions.zw
Password: Test@1234
```

3. **Expected:**
   - Dashboard loads without errors
   - Shows "Personal Details" button
   - Stats display correctly
   - No 401 or 404 errors in console

## Step 7: Test Personal Details Verification

1. Click **"Personal Details"** button
2. Upload three documents:
   - National ID (any image)
   - Proof of Address (any image)
   - ID with Selfie (any image or camera capture)
3. Click **"Submit Verification Documents"**
4. Expected: Success message, redirect to dashboard

## Step 8: Test Listing Creation

1. On Dashboard, click **"New Listing"**
2. Fill in details:
   - Stand Number: TEST-STAND-001
   - Title Deed: TD-TEST-001
   - Price: 100000
   - Size: 500 sqm
   - Location: Harare (use map or type)
3. Click **"Create Listing"**
4. Expected: Listing created, redirects to detail page

---

## Troubleshooting

### Issue: "401 Unauthorized" Error

**Solution:**
1. Clear browser cookies completely (Step 2)
2. Close browser completely
3. Reopen browser fresh
4. Sign in again

### Issue: "404 Not Found" on API calls

**Solution:**
1. Make sure backend is running on port 5000
2. Check Terminal 1 output for `✅ Database Connection Successful`
3. If not, restart server: `npm start` in /server

### Issue: Frontend not loading or showing blank page

**Solution:**
1. Check Terminal 2 - frontend should show `VITE ready`
2. Hard refresh browser: `Ctrl+Shift+R` (or `Cmd+Shift+R` Mac)
3. If still not working, restart frontend: `npm run dev`

### Issue: Files not updating in browser

**Solution:**
1. Close browser completely
2. Hard refresh: `Ctrl+Shift+R`
3. Check Terminal 2 - should show "✓ compiled client"

### Issue: Database errors

**Solution:**
1. Check if MongoDB is running
2. Verify `MONGODB_URI` in `/server/.env` is correct
3. Run: `node scripts/clear-and-seed.js` to reset database

---

## Test Accounts

### All accounts have password: `Test@1234`

```
SYSTEM_ADMIN:
  Email: admin@landsolutions.zw

VERIFICATION_OFFICER:
  Email: officer@landsolutions.zw

SELLER (Already Verified):
  Email: seller@landsolutions.zw

BUYER:
  Email: buyer@landsolutions.zw
```

---

## Key API Endpoints

All should work without errors after proper restart:

```
GET  /api/dashboard/public-stats         → Platform stats
GET  /api/land                           → All listings
POST /api/land/create                    → Create listing
POST /api/user/verify-seller-details     → Verify personal details
GET  /api/user/:id                       → User profile
```

---

## Expected Port Configuration

- **Backend (Express):** `http://localhost:5000`
- **Frontend (Vite Dev Server):** `http://localhost:5173`
- **Proxy (Vite → Backend):** Automatic (configured in vite.config.js)

---

## Still Having Issues?

If you're still experiencing errors after following all steps:

1. **Check console errors** - Browser DevTools (F12) → Console tab
2. **Check server logs** - Terminal 1 (server output)
3. **Check network tab** - Browser DevTools → Network tab
4. **Look for 401/404/500 errors** - These indicate specific issues

**Most common causes:**
- ❌ Backend not running
- ❌ Wrong port (5000 vs 5173)
- ❌ Stale cookies/cache
- ❌ MongoDB not running

---

## Quick Commands Reference

```bash
# Start backend
cd server && npm start

# Start frontend
cd client && npm run dev

# Reset database
cd server && node scripts/clear-and-seed.js

# Kill process on port 5000 (if stuck)
# Windows: netstat -ano | findstr :5000
# Linux/Mac: lsof -i :5000

# View package versions
npm list
```

