# System Health Check

Run this checklist to verify your system is properly configured:

## ✅ Prerequisites

- [ ] Node.js installed (v18+): `node --version`
- [ ] npm installed: `npm --version`
- [ ] MongoDB running: Check MongoDB service status
- [ ] Git (optional): `git --version`

## ✅ Environment Configuration

### Server (.env file)
Location: `/server/.env`

Check these values are set:
```
✓ MONGODB_URI=mongodb://localhost:27017/land-solutions
✓ PORT=5000
✓ JWT_SECRET_KEY=<any-value>
✓ CLIENT_URL=http://localhost:5173
✓ NODE_ENV=development
```

### Client (vite.config.js)
Location: `/client/vite.config.js`

Should have proxy configuration:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
    secure: false,
    rewrite: (path) => path,
    withCredentials: true,
  }
}
```

## ✅ Dependencies

### Server
```bash
cd server
npm list express mongoose jsonwebtoken cors
```

Should show all packages installed.

### Client
```bash
cd client
npm list react react-redux react-router-dom
```

Should show all packages installed.

## ✅ Database

### MongoDB Connection
```bash
# Test MongoDB is running
mongosh --eval "db.adminCommand('ping')"
```

Expected output:
```
{ ok: 1 }
```

### Database Reset (if needed)
```bash
cd server
node scripts/clear-and-seed.js
```

Expected output:
```
✅ Connected to MongoDB
✅ All collections cleared
✅ Created 4 test users
✅ Created 3 test listings
```

## ✅ Backend Server

### Start Backend
```bash
cd server
npm start
```

Check for these messages:
```
✅ Database Connection Successful.
🚀 Server running on http://localhost:5000
```

### Test Backend API
```bash
# In another terminal
curl http://localhost:5000/api/user/test
```

Expected response:
```
Hello World!
```

## ✅ Frontend Server

### Start Frontend
```bash
cd client
npm run dev
```

Check for:
```
✅ Vite dev server running
✅ Ready to accept connections on http://localhost:5173
```

### Test Frontend Loading
Open browser to: `http://localhost:5173`

Expected:
- [ ] Page loads without errors
- [ ] No 404 or 500 errors
- [ ] Can see login form

## ✅ Authentication Flow

### Test Login
1. Go to `http://localhost:5173`
2. Sign in with: `seller@landsolutions.zw` / `Test@1234`
3. Check for:
   - [ ] No 401 errors in console
   - [ ] No "Invalid token" messages
   - [ ] Dashboard loads
   - [ ] User data displays

### Check Cookies
In browser DevTools (F12):
1. Go to Application/Storage tab
2. Under Cookies → http://localhost:5173
3. Should see: `access_token` cookie
4. Cookie should have: HttpOnly, Secure (on HTTPS), SameSite=Strict

## ✅ API Communication

### Test API Endpoint
In browser console:
```javascript
fetch('/api/dashboard/public-stats', {
  credentials: 'include'
})
.then(r => r.json())
.then(d => console.log(d))
```

Expected response:
```javascript
{
  success: true,
  data: {
    totalListings: 3,
    verifiedListings: 3,
    pendingListings: 0,
    ...
  }
}
```

## ✅ Feature Testing

### Test Personal Details Verification
1. Log in as seller
2. Click "Personal Details" button
3. Upload test documents
4. Check for:
   - [ ] No 500 errors
   - [ ] Success message displays
   - [ ] Redirects to dashboard
   - [ ] Status shows as verified

### Test Listing Creation
1. Log in as seller
2. Click "New Listing"
3. Fill form and submit
4. Check for:
   - [ ] No 500 errors
   - [ ] Listing created
   - [ ] Redirects to listing detail
   - [ ] Status shows as VERIFIED (if seller verified)

### Test Buyer View
1. Log in as buyer
2. Go to "Browse Stands"
3. Check for:
   - [ ] Can see verified listings
   - [ ] Cannot see unverified seller listings
   - [ ] Can click on listings

## 🐛 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Cookie not sent | Clear browser cache, restart server |
| 404 Not Found | Backend not running | Start server: `npm start` in /server |
| 500 Internal Error | Backend error | Check server console for error logs |
| Connection refused | Port 5000 in use | Kill process: `netstat -ano \| findstr :5000` |
| Blank page | Frontend error | Check browser console (F12) |
| CORS error | Proxy misconfigured | Check vite.config.js changeOrigin setting |

## 📊 System Status Script

Create a file `system-status.sh`:

```bash
#!/bin/bash
echo "🔍 System Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━"

# Check Node
echo "✓ Node: $(node --version)"
echo "✓ npm: $(npm --version)"

# Check ports
echo ""
echo "Port Status:"
netstat -ano 2>/dev/null | grep -E ":5000|:5173|:27017" || echo "  Checking ports..."

# Check MongoDB
echo ""
echo "MongoDB Status:"
mongosh --eval "db.adminCommand('ping')" 2>/dev/null && echo "  ✅ Connected" || echo "  ❌ Not running"

# Check server
echo ""
echo "Backend Server:"
curl -s http://localhost:5000/api/user/test 2>/dev/null && echo "  ✅ Running" || echo "  ❌ Not running"

# Check frontend
echo ""
echo "Frontend Server:"
curl -s http://localhost:5173 2>/dev/null | grep -q "DOCTYPE" && echo "  ✅ Running" || echo "  ❌ Not running"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━"
```

Run with: `bash system-status.sh`

---

## ✅ Final Verification

After passing all checks above:

- [ ] Backend running on 5000
- [ ] Frontend running on 5173
- [ ] MongoDB connected
- [ ] Can log in without errors
- [ ] Can submit personal details
- [ ] Can create listings
- [ ] Can view listings as buyer
- [ ] No 401/404/500 errors in console

If all checks pass, **your system is ready!** 🎉

