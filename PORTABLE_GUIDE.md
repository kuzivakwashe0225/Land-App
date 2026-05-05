# 🚀 Land Solutions Platform - Portability & Testing Guide

This guide ensures the system can be cloned, seeded, and tested by anyone, anywhere.

## 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB** (Local or Atlas)
- **Firebase Account** (For document storage)

## 2. Environment Setup
Clone the repository and create `.env` files in both the `server` and `client` directories.

### Server `.env` (`/server/.env`)
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET_KEY=any_random_long_string
PORT=5000

# Firebase Configuration (Required for document uploads)
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
```

## 3. Database Migration (Seeding)
To test the system properly, you must seed the **Authority Registry**. This simulates the municipal database used for verification.

1. Navigate to the server directory: `cd server`
2. Install dependencies: `npm install`
3. Run the authority seed script: `npm run seed:authority`

## 4. Testing the Verification Process
The system uses a **Rules-Based Automated Verification**. Here is how to test it:

### Test Case: Automatic Verification (A-Grade)
1. **Sign Up** as a **SELLER**.
2. Go to **Create Land Listing**.
3. In the **Street Address** field, type: `123 Borrowdale Road`
4. Click the **"Search Registry"** button (Blue).
5. **What happens?** 
   - The system finds the official record.
   - It auto-pings the map to the correct GPS coordinates.
   - It sets the Stand Number to `HRE-BD-2456`.
6. Fill in the rest of the form (Price, Size, etc.).
7. **Important**: Ensure your **National ID** in your profile matches the registry: `63-245678Z45`.
8. Submit the listing.
9. **Result**: The listing will be **AUTO-VERIFIED** and immediately visible to buyers.

### Test Addresses in Registry:
- `123 Borrowdale Road` (Harare)
- `45 Avondale Drive` (Harare)
- `12 Westgate Crescent` (Harare)
- `88 Samora Machel Avenue` (Harare)
- `15 Main Street` (Bulawayo)

## 5. Troubleshooting
### "Functions not working on pulled code"
- **Redux State**: If you are getting "Access Denied" or routing loops, try clearing your browser's Local Storage and Cookies, then sign in again.
- **Proxy Issues**: Ensure the server is running on port `5000`. The Vite frontend is configured to proxy `/api` requests to `localhost:5000`.
- **Firebase Errors**: If document uploads fail, check your Firebase storage rules (ensure they allow read/write or are set for testing).
