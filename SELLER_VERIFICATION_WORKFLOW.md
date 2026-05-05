# Seller Personal Details Verification Workflow

## Overview

The system now uses a **two-step seller verification process** to ensure buyer confidence while allowing quick listing creation:

1. **Create Listing** - Sellers can list properties immediately without delays
2. **Verify Personal Details** - Sellers complete identity verification to unlock verified seller status

---

## How It Works

### Step 1: Create Land Listing (Immediate)

**Seller flow:**
1. Click "New Listing" on Dashboard
2. Fill in property details
3. Click "Create Listing"
4. **Result:** Listing is created and saved
   - **If seller NOT verified:** Status = **PENDING_VERIFICATION** (hidden from buyer search)
   - **If seller IS verified:** Status = **VERIFIED** (appears in buyer search)

**Timeline:** Instant ✓

---

### Step 2: Complete Personal Details Verification (Optional)

**To unlock verified seller status:**

1. Go to Dashboard → Click "Personal Details"
2. Upload three documents:
   - National ID (photo or scan)
   - Proof of Address (utility bill, bank statement, etc.)
   - ID with Selfie (live photo holding your ID)
3. Click "Submit Verification Documents"
4. Documents reviewed (instant or manual approval)

**Timeline:** Immediate to 24 hours

---

## Listing Status Based on Seller Verification

### Scenario A: Unverified Seller Creates Listing

```
Seller Status: NOT VERIFIED PERSONAL DETAILS
           ↓
    Listing Created
           ↓
    Status: PENDING_VERIFICATION
           ↓
    Visibility: HIDDEN from buyer search
           ↓
    Action: Seller must verify personal details
```

**What seller sees:**
- Listing created successfully
- Banner: "Complete personal details verification to make this listing visible to buyers"

**What buyers see:**
- Nothing - listing doesn't appear in search

---

### Scenario B: Verified Seller Creates Listing

```
Seller Status: ✓ VERIFIED PERSONAL DETAILS
           ↓
    Listing Created
           ↓
    Status: VERIFIED
           ↓
    Visibility: SHOWS in buyer search
           ↓
    Result: Buyers can see and inquire
```

**What seller sees:**
- "Your listing is now visible to buyers"

**What buyers see:**
- Listing appears with green ✓ Verified badge

---

### Scenario C: Unverified Seller Completes Verification

```
Seller has: 3 unverified listings (PENDING_VERIFICATION)
           ↓
    Seller completes personal details verification
           ↓
    System processes verification (instant)
           ↓
    Seller Status: ✓ VERIFIED
           ↓
    All pending listings → VERIFIED status
           ↓
    Listings now appear in buyer search
```

**Result:** All existing and future listings become immediately visible to buyers

---

## Dashboard Changes for Sellers

### Before Verification:
- ✗ Listings show as "Pending Seller Verification"
- ✗ Not visible to buyers
- ⚠️ "Personal Details" button is highlighted
- 📢 Banner: "Verify your personal details to unlock verified seller status"

### After Verification:
- ✓ All listings show as "Verified"
- ✓ Visible to all buyers
- ✓ "Personal Details" shows as ✓ Completed
- 📈 Buyer inquiries start arriving

---

## Benefits of This Workflow

### For Sellers:
✓ **Quick start** - List properties immediately
✓ **Professional** - Verification shows you're authentic
✓ **Control** - Decide when to verify based on readiness
✓ **Trusted status** - Once verified, all listings get verified badge
✓ **Easy process** - Simple document upload, instant or fast approval

### For Buyers:
✓ **Confidence** - Only see verified sellers' listings
✓ **Trust** - Know seller has been identity-checked
✓ **Safety** - Reduced fraud risk
✓ **Quality** - Higher commitment from sellers

### For Platform:
✓ **Growth** - More seller sign-ups (no KYC blocking)
✓ **Trust** - Still maintain seller verification
✓ **Fraud prevention** - Identity validation before selling
✓ **Professionalism** - "Personal Details" sounds better than "KYC"

---

## Document Requirements

### National ID
- Clear photo or scan
- Both sides visible (if applicable)
- Legible - all text must be readable

### Proof of Address
- Utility bill (electricity, water, gas)
- Bank statement
- Government letter
- All must be dated within 3 months

### ID with Selfie
- Live photo of you holding your ID
- Your face must be clearly visible
- ID card must be fully visible with text readable
- Taken in good lighting
- No filters or heavy editing

---

## Status Definition

| Status | Meaning | Visible to Buyers | Seller Action |
|--------|---------|------------------|---------------|
| **PENDING_VERIFICATION** | Listing created, waiting for seller to verify personal details | ❌ No | Complete personal details verification |
| **VERIFIED** | Seller verified personal details, listing approved | ✅ Yes | None required - listing is live |
| **FLAGGED** | Fraud detection triggered | ❌ No | Respond to officer inquiry |
| **REJECTED** | Officer reviewed and rejected | ❌ No | Contact support |

---

## For Support / Issues

### "I created a listing but it doesn't show to buyers"
→ Complete "Personal Details" verification on Dashboard

### "How long does verification take?"
→ Instant approval on submission (no delays)

### "Do I need to verify each listing?"
→ No - verify once as a seller, all your listings become verified

### "Can I sell while waiting for verification?"
→ No - listings only show to buyers after verification

---

## Technical Details

**Field in User Model:**
```
user.verification.sellerDetailsApproved (boolean)
user.verification.sellerDetailsSubmittedAt (Date)
user.verification.sellerDetailsApprovedAt (Date)
```

**API Endpoint:**
```
POST /api/user/verify-seller-details/submit
```

**Workflow Trigger:**
- When seller completes personal details verification
- All their PENDING_VERIFICATION listings automatically become VERIFIED
- They receive notification: "Your listings are now verified and visible to buyers"

---

## User Journey Timeline

```
Day 1, 9:00 AM
  └─ Seller creates account
     └─ Status: Unverified

Day 1, 9:15 AM
  └─ Seller creates first listing
     └─ Listing Status: PENDING_VERIFICATION (hidden)
     └─ Dashboard shows: "Verify to unlock"

Day 1, 10:00 AM
  └─ Seller completes personal details verification
     └─ Documents submitted
     └─ Instant approval ✓

Day 1, 10:01 AM
  └─ Seller's status: VERIFIED ✓
     └─ Listing status changes to: VERIFIED ✓
     └─ Listing now shows in buyer search
     └─ First buyer inquiry arrives

Day 1, 2:00 PM
  └─ Seller creates second listing
     └─ Listing status: VERIFIED ✓ (auto-verified - seller is verified)
     └─ Immediately visible to buyers
```

---

## Comparison: Old vs New

| Aspect | Old Way (KYC) | New Way (Personal Details) |
|--------|---------------|---------------------------|
| **Name** | "KYC Verification" | "Personal Details" |
| **When required** | Before creating listings | After creating listings |
| **User experience** | Blocking, frustrating | Flexible, permissive |
| **Seller can list immediately** | ❌ No | ✅ Yes |
| **Listings visible to buyers** | When KYC approved | When seller verifies |
| **Documents needed** | Same | Same (ID, Address, Selfie) |
| **Timeline** | Slow | Fast |
| **Professional tone** | Technical | Business-friendly |

---

## Migration Notes

For existing sellers:
- Old "KYC" field remains in system (backward compatible)
- New "Personal Details" field is separate
- Sellers can complete Personal Details to unlock verified status
- No requirement to re-submit if KYC already approved

