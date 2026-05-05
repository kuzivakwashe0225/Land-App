# 📋 Signup Format Guide - Quick Reference

## Field Formats (Copy & Paste Friendly)

### Phone Number
```
Format: +263XXXXXXXXX or 0XXXXXXXXX
Total digits: 11 (after +263 or 0)

✓ VALID:
  +263773123456
  +263712345678
  0773123456
  0712345678

✗ INVALID:
  263773123456 (missing + or 0)
  +2637731234 (only 10 digits)
  0773-123-456 (contains dashes)
```

### National ID
```
Format: XX-XXXXXXXAXX
Pattern: 2 digits - 7 digits + 1 letter + 2 digits

✓ VALID:
  63-245678Z45
  45-123456A78
  00-999999Z99
  12-345678B34

✗ INVALID:
  63245678Z45 (missing dash)
  63-245678z45 (lowercase letter)
  63-24567Z45 (only 6 digits)
  63-2456789Z4 (too many digits)
```

### Email
```
Format: standard email format
Must include: name@domain.extension

✓ VALID:
  john@example.com
  user.name@company.co.zw
  test123@email.org
  name+tag@domain.com

✗ INVALID:
  john@example (missing extension)
  @example.com (missing name)
  john.example.com (missing @)
```

### Password
```
Minimum requirements:
  - At least 8 characters
  - At least 1 UPPERCASE letter (A-Z)
  - At least 1 number (0-9)

✓ VALID:
  Test@1234 (8 chars, uppercase, number)
  MyPassword99 (12 chars, uppercase, number)
  Secure123Pass (13 chars, uppercase, number)
  P@ssw0rd (8 chars, uppercase, number)

✗ INVALID:
  password123 (no uppercase)
  PASSWORD123 (no lowercase - but acceptable)
  TestPass (no number)
  Test1 (only 5 characters)
```

### First Name & Last Name
```
Minimum: 2 characters
Maximum: 50 characters
Allowed: Letters, spaces, hyphens, apostrophes

✓ VALID:
  John
  Mary-Jane
  O'Brien
  Jean Claude

✗ INVALID:
  J (only 1 character)
  John123 (contains numbers)
  John@ (contains special char)
```

---

## Test Data Set

Use these values to test signup quickly:

### Set 1:
```
First Name: Test
Last Name: User
Email: testuser@example.com
Phone: +263773123456
National ID: 63-245678Z45
Password: TestPass123
```

### Set 2:
```
First Name: John
Last Name: Doe
Email: johndoe@example.com
Phone: 0773654321
National ID: 45-123456A78
Password: JohnDoe@2024
```

### Set 3:
```
First Name: Jane
Last Name: Smith
Email: janesmith@example.com
Phone: +263712987654
National ID: 00-999999Z99
Password: JaneSmith99!
```

---

## Zimbabwe Phone Numbers Explained

Zimbabwe country code: **+263**

Mobile network prefixes (first digit after 263):
- **7** = Economical/Telecel/NetOne
- **7** = Vodacom

Full format:
```
+263 77 123 4567  →  +263771234567 (11 total digits)
 0  77 123 4567  →   0771234567 (11 total digits)
```

---

## Step-by-Step Signup Example

1. **First Name:** John (✓ Valid)
2. **Last Name:** Doe (✓ Valid)
3. **Email:** john.doe@example.com (✓ Valid)
4. **Phone:** +263773456789 (✓ Valid - 11 digits)
5. **National ID:** 63-245678Z45 (✓ Valid - XX-XXXXXXXAXX)
6. **Role:** BUYER (select from dropdown)
7. **Password:** MyPassword123 (✓ Valid - 12 chars, uppercase, number)
8. **Click Sign Up**
9. **See:** "Account created! Check your email."
10. **Check:** Email inbox for verification link
11. **Click:** Verification link in email
12. **Confirm:** "Email verified! You can now sign in."
13. **Sign In:** Use your email and password

---

## Common Mistakes to Avoid

| Mistake | Fix |
|---------|-----|
| Phone: 263773123456 | Use: +263773123456 or 0773123456 |
| National ID: 63245678Z45 | Use: 63-245678Z45 (add dash) |
| National ID: 63-245678z45 | Use: 63-245678Z45 (uppercase letter) |
| Password: password123 | Use: Password123 (add uppercase) |
| Name: Jo | Use: John (minimum 2 characters) |
| Email: john@example | Use: john@example.com (needs extension) |

---

## Validation Happens In Two Places

### 1. Frontend (Browser)
- Real-time validation as you type
- Shows green ✓ for valid fields
- Shows red ✗ for invalid fields
- Submit button disabled until all valid

### 2. Backend (Server)
- Double-checks all data
- Checks for duplicates
- Returns detailed error messages
- Safely stores data in database

---

## If You Get An Error

1. **Read the error message carefully**
2. **Check the field it mentions**
3. **Match the format from above**
4. **Re-enter the value**
5. **Try again**

Example error: "Phone must be in format +263xxxxxxxxx or 0xxxxxxxxx"
→ Your phone number doesn't match the format
→ Use: +263773123456 or 0773123456 (11 digits)

---

## Support

For detailed troubleshooting, see: **SIGNUP_TROUBLESHOOTING.md**

For system-wide issues, see: **QUICK_START_GUIDE.md**

---

**Quick Signup Testing:**
```bash
cd server
node scripts/test-signup.js
```

This will verify your signup system is working correctly before you test it in the browser.

---

**Version:** 1.0  
**Last Updated:** May 3, 2026
