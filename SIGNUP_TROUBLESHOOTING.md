# 🔧 Signup System Troubleshooting Guide

## Quick Status Check

Run the test script to verify your signup system is working:

```bash
cd server
node scripts/test-signup.js
```

This will check:
✓ MongoDB connection  
✓ Field validation patterns  
✓ Email configuration  
✓ JWT setup  
✓ User creation capability  

---

## Common Signup Errors & Solutions

### 1. ❌ "Phone must be in format +263xxxxxxxxx or 0xxxxxxxxx"

**Problem:** Invalid phone number format

**Solutions:**
- ✓ Use **+263773123456** (11 digits after country code)
- ✓ Use **0773123456** (11 digits starting with 0)
- ✗ Do NOT use: 263773123456 (missing + or 0)
- ✗ Do NOT use: 07731234 (only 8 digits)

**Zimbabwe phone format:**
```
+263 773 123 456  → +263773123456
 0  773 123 456  →  0773123456
```

---

### 2. ❌ "National ID format: XX-XXXXXXXAXX"

**Problem:** Invalid national ID format

**Solutions:**
- ✓ Use **63-245678Z45** (with dash, uppercase letter)
- ✓ Format: **XX-XXXXXXXAXX**
  - 2 digits
  - 1 dash
  - 7 digits
  - 1 uppercase letter
  - 2 digits

**Examples:**
- 63-245678Z45 ✓
- 45-123456A78 ✓
- 00-999999Z99 ✓

**Common mistakes:**
- ✗ 63245678Z45 (missing dash)
- ✗ 63-245678z45 (lowercase letter)
- ✗ 63-24567Z45 (only 6 digits in middle)

---

### 3. ❌ "This email is already registered"

**Problem:** Email already exists in system

**Solutions:**
- Use a different email address
- If you created an account before, try signing in instead
- To reset: Contact admin or wait for account cleanup

---

### 4. ❌ "This phone number is already registered"

**Problem:** Phone number already linked to another account

**Solutions:**
- Use a different phone number
- Remove the old account first (contact admin)
- Each user can only have one account per phone number

---

### 5. ❌ "This National ID is already registered"

**Problem:** National ID already in system

**Solutions:**
- Use a different National ID
- Each National ID can only create one account
- If you forgot your password, use "Forgot Password" instead

---

### 6. ❌ "Password does not meet security requirements"

**Problem:** Weak password

**Password must have:**
- ✓ Minimum 8 characters
- ✓ At least 1 UPPERCASE letter (A-Z)
- ✓ At least 1 number (0-9)

**Examples:**
- Test@1234 ✓
- MyPassword123 ✓
- SecurePass99 ✓

**Common mistakes:**
- ✗ password123 (no uppercase)
- ✗ PASSWORD (no number)
- ✗ Pass1 (too short)
- ✗ pass@word (no uppercase)

---

### 7. ⚠️ Email not received (but account created)

**Problem:** Verification email didn't arrive

**Solutions:**

**Option A: Use resend button**
1. Go back to signup page
2. Account already created → Click "Resend verification email"
3. Check spam/junk folder

**Option B: Bypass email (development)**
1. Account is created (you can see it in database)
2. Use MongoDB to manually verify:
   ```bash
   mongosh
   use land-solutions
   db.users.updateOne(
     { email: "your-email@example.com" },
     { $set: { isEmailVerified: true } }
   )
   ```
3. Then sign in normally

**Option C: Configure real email**
See Email Configuration section below

---

### 8. ⚠️ "Network error" when signing up

**Problem:** Cannot connect to server

**Solutions:**
1. Check server is running:
   ```bash
   npm run dev  # in server directory
   ```
2. Check port 5000 is available:
   ```bash
   lsof -i :5000  # See what's using port 5000
   ```
3. Check CORS is enabled (should be automatic)
4. Check firewall allows localhost:5000

---

## Email Configuration

### For Development (Optional)

Email is **optional for development**. Accounts will still be created without email.

To see verification emails in console:
1. Leave EMAIL_USER and EMAIL_PASS as placeholder values
2. Emails will print to server console
3. Extract the verification link from console output

### For Production (Required)

#### Gmail Setup:
1. Enable 2FA on Gmail account
2. Create App Password (not your regular password)
3. In `.env`:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-char-app-password
   ```
4. Test by signing up

#### Alternative Email Services:
See `server/utils/notifications.js` for Nodemailer integration

---

## Database Verification

### Check Users Created

```bash
mongosh
use land-solutions
db.users.find({}, { email: 1, firstName: 1, role: 1, isEmailVerified: 1 })
```

### Count Total Users

```bash
db.users.countDocuments()
```

### Find Specific User

```bash
db.users.findOne({ email: "test@example.com" })
```

### Manually Verify Email (Development)

```bash
db.users.updateOne(
  { email: "test@example.com" },
  { $set: { isEmailVerified: true } }
)
```

---

## Full Signup Flow

### Step 1: Frontend Validation
- Client checks password requirements live
- Shows errors per field
- Submit button disabled until valid

### Step 2: Server Validation
- All fields validated again on backend
- Duplicate email/phone/ID checks
- Returns detailed errors per field

### Step 3: Create User
- Password hashed with bcrypt
- Verification token generated and hashed
- User saved to database
- Account created with status ACTIVE

### Step 4: Send Verification Email (Optional)
- Email transporter initialized
- Verification link sent to user email
- Token expires in 24 hours
- Email failure doesn't break signup

### Step 5: Sign In
- User must verify email first
- Click link from email or resend
- Mark as isEmailVerified = true
- Then can sign in with password

### Step 6: Full Access
- Email verified ✓
- Account active ✓
- Can browse listings, create profile, etc.

---

## Testing Signup Locally

### Test Case 1: Valid Registration

```
First Name: John
Last Name: Doe
Email: john.doe@example.com
Phone: +263773123456
National ID: 63-245678Z45
Role: BUYER
Password: Test@1234

Expected: ✓ Account created. Check your email.
```

### Test Case 2: Duplicate Email

```
(After creating john.doe@example.com)

Try to create same account again

Expected: ✗ Email already registered
```

### Test Case 3: Invalid Phone

```
Phone: 077312 (too short)

Expected: ✗ Phone must be +263xxxxxxxxx or 0xxxxxxxxx
```

### Test Case 4: Invalid National ID

```
National ID: 63245678Z45 (missing dash)

Expected: ✗ National ID format: XX-XXXXXXXAXX
```

### Test Case 5: Weak Password

```
Password: password (no uppercase, no number)

Expected: ✗ Must contain uppercase letter and number
```

---

## Debugging

### Enable Detailed Logging

```bash
# Terminal 1: Start server with debug
DEBUG=* npm run dev

# Terminal 2: Monitor MongoDB
mongosh
db.users.watch()
```

### Check Server Logs

Look for these messages:
- `✓ User registered successfully: email@example.com`
- `✓ Verification email sent to: email@example.com`
- `Signup error: ...` (if there's an issue)

### Check Network Tab (Browser)

1. Open browser DevTools (F12)
2. Go to Network tab
3. Attempt signup
4. Click the POST request to `/api/auth/signup`
5. Check:
   - Status: 201 (success) or 400/409 (error)
   - Response body has error details
   - Headers sent correctly

---

## Environment Variables Checklist

```bash
# .env file must have:
PORT=5000
MONGODB_URI=mongodb://localhost:27017/land-solutions
NODE_ENV=development
JWT_SECRET_KEY=your_secret_here
CLIENT_URL=http://localhost:5173

# Optional (for email):
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

---

## Still Having Issues?

### Provide these details when asking for help:

1. **Error message** (from browser or server)
2. **Test data used** (email, phone, national ID, password)
3. **Server logs** output
4. **Browser console** errors (F12 → Console tab)
5. **MongoDB** status (`mongosh` connects?)
6. **Network response** (DevTools → Network tab)

### Quick Fixes to Try:

```bash
# 1. Kill any process on port 5000
lsof -i :5000
kill -9 <PID>

# 2. Clear MongoDB test data
mongosh
use land-solutions
db.users.deleteMany({})

# 3. Restart everything
# Terminal 1:
cd server && npm run dev

# Terminal 2:
cd client && npm run dev

# 4. Test with exact format
Email: testuser@example.com
Phone: +263773123456
National ID: 63-245678Z45
Password: TestPass123
```

---

## Success Indicators

When signup works correctly:

```
✓ Form accepts all fields without errors
✓ Submit button enables when form is valid
✓ "Account created successfully!" message appears
✓ Option to "Resend verification email" shown
✓ User appears in MongoDB: db.users.find()
✓ isEmailVerified: false initially
✓ After verifying email: isEmailVerified: true
✓ Can sign in with verified account
✓ Get verification token and can reset password
✓ Role-based access works (BUYER vs SELLER)
```

---

**Version:** 2.0  
**Last Updated:** May 3, 2026  
**Status:** Complete Fix Guide
