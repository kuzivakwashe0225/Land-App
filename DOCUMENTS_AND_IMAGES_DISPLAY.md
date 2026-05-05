# Documents & Images Display Fix

## Summary

All documents and photos uploaded on land listings are now properly displayed with correct permission controls.

---

## What's Fixed

### ✅ Images Display in Listings
- **Before:** Cards showed placeholder "Property Images Coming Soon"
- **After:** Shows first image as thumbnail with:
  - Zoom effect on hover
  - Count badge showing "+X more images"
  - Fallback placeholder if image fails to load

### ✅ Images Display in Detail View
- **Before:** Placeholder only
- **After:** Full image gallery with:
  - Large display
  - Previous/Next navigation buttons
  - Image counter (e.g., "2/5 Photos")
  - Smooth transitions

### ✅ Documents Display with Permissions
- **Before:** Documents not visible or searchable
- **After:** Documents shown with role-based access:
  - **Officers/Admins:** Always see all documents
  - **Sellers (Owner):** See their own documents
  - **Sellers (Non-owner):** Cannot see documents
  - **Buyers (Completed transaction):** Can see documents
  - **Buyers (No transaction):** Cannot see documents

### ✅ Document Management UI
- Document count badge showing number of uploaded docs
- Expandable/collapsible section
- Download links for each document
- Upload date display
- Clean visual hierarchy

---

## How It Works

### Image Storage & Retrieval

**Upload Flow:**
```
User uploads image
    ↓
FormData sent with field name "images"
    ↓
Backend multer captures image
    ↓
Stored at: /uploads/land-images/{landId}/img-{timestamp}.{ext}
    ↓
URL saved to database: /uploads/land-images/{landId}/img-1234567890.jpg
    ↓
Vite proxy forwards to http://localhost:5000/uploads/...
    ↓
Static middleware serves image file
```

**Display Flow:**
```
LandListings component fetches lands via /api/land
    ↓
API response includes images array: ["/uploads/land-images/...", ...]
    ↓
LandVerificationCard component displays first image
    ↓
LandDetail component displays full gallery
    ↓
Images render with fallback on error
```

### Document Storage & Display

**Upload Flow:**
```
User uploads document
    ↓
FormData sent with field name "titleDeed" or "documents"
    ↓
Backend multer captures document
    ↓
Stored at: /uploads/land-documents/{landId}/{docType}-{timestamp}.{ext}
    ↓
Metadata saved to database:
{
  documentType: "TITLE_DEED",
  documentUrl: "/uploads/land-documents/...",
  uploadedAt: "2026-05-05T..."
}
    ↓
Stored in: land.verification.verificationDocuments[]
```

**Permission-Based Display:**
```
User requests /api/land/{landId}
    ↓
Backend checks user role and permissions
    ↓
BUYER:
  ├─ Has completed transaction? → Show documents
  └─ No transaction → Strip documents
    ↓
SELLER:
  ├─ Is owner? → Show documents
  └─ Not owner → Strip documents
    ↓
OFFICER/ADMIN:
  └─ Always show documents
```

---

## Frontend Components

### LandVerificationCard (Listing View)

```javascript
// Image Thumbnail Section
<div className="relative h-48 bg-gray-200 overflow-hidden group">
  {land.images && land.images.length > 0 ? (
    <>
      <img src={land.images[0]} />
      {land.images.length > 1 && (
        <div className="absolute top-2 right-2 ...">+{land.images.length - 1} more</div>
      )}
    </>
  ) : (
    <div className="...">No images</div>
  )}
</div>

// Document Section
<div className="border-t pt-3 mt-3">
  <div className="flex justify-between items-center mb-2">
    <p>📄 Documents</p>
    {land.verification?.verificationDocuments?.length > 0 && (
      <span className="bg-blue-100">{land.verification.verificationDocuments.length}</span>
    )}
  </div>
  
  {canSeeDocuments ? (
    // Show expandable documents
  ) : (
    <p>🔒 Documents visible to authorized users only</p>
  )}
</div>
```

### LandDetail (Detail View)

```javascript
// Full Gallery
{land.images && land.images.length > 0 ? (
  <>
    <img src={land.images[selectedImageIndex]} />
    {land.images.length > 1 && (
      <>
        <button onClick={() => setSelectedImageIndex(...)} >‹</button>
        <button onClick={() => setSelectedImageIndex(...)} >›</button>
      </>
    )}
    <div className="..."> {selectedImageIndex + 1}/{land.images.length} </div>
  </>
) : (
  <div>No Images Available</div>
)}

// Document Display with Permissions
{canViewDocuments ? (
  land.verification?.verificationDocuments?.map(doc => (
    <a href={doc.documentUrl} target="_blank">
      {doc.documentType.replace('_', ' ')} ⬇
    </a>
  ))
) : (
  <p>Documents visible after purchase</p>
)}
```

---

## Backend Endpoints

### GET /api/land (List Listings)
**Returns:** Array of lands with:
- ✅ `images` field included
- ❌ `verification.verificationDocuments` excluded (for list view)
- ✅ Basic verification data

```javascript
const fields = 'standNumber titleDeedNumber location landDetails transaction 
               verification.status verification.isVerified images owner 
               createdAt updatedAt';
```

### GET /api/land/{landId} (Get Detail)
**Returns:** Single land with:
- ✅ `images` field included
- ✅/❌ `verification.verificationDocuments` included/excluded based on permissions
- ✅ Full verification data

```javascript
// For OFFICER/ADMIN: Full access
// For SELLER (owner): Full access to own listing
// For SELLER (non-owner): Documents stripped
// For BUYER (completed transaction): Documents included
// For BUYER (no transaction): Documents stripped
```

### POST /api/land/{landId}/documents (Upload)
**Accepts:** FormData with fields:
- `titleDeed` (files)
- `documents` (files)
- `images` (files)

**Returns:**
```json
{
  "success": true,
  "message": "X documents and Y images uploaded successfully",
  "data": {
    "documentsCount": 2,
    "imagesCount": 3,
    "documents": [...],
    "images": [...]
  }
}
```

---

## File Paths

### Image URLs
```
/uploads/land-images/{landId}/img-{timestamp}.{extension}
Example: /uploads/land-images/507f1f77bcf86cd799439011/img-1714953600000.jpg
```

### Document URLs
```
/uploads/land-documents/{landId}/{docType}-{timestamp}.{extension}
Example: /uploads/land-documents/507f1f77bcf86cd799439011/TITLE_DEED-1714953600000.pdf
```

### Accessing Files
- **Direct:** `http://localhost:5000/uploads/land-images/.../img.jpg`
- **Via Proxy:** Vite dev server proxies to backend
- **In Production:** Served by Express static middleware

---

## Permission Matrix

| User Type | Can View Images | Can View Documents | Can Download |
|-----------|-----------------|-------------------|--------------|
| **BUYER (No transaction)** | ✅ Yes | ❌ No | ❌ No |
| **BUYER (Completed)** | ✅ Yes | ✅ Yes | ✅ Yes |
| **SELLER (Owner)** | ✅ Yes | ✅ Yes | ✅ Yes |
| **SELLER (Non-owner)** | ✅ Yes | ❌ No | ❌ No |
| **VERIFICATION_OFFICER** | ✅ Yes | ✅ Yes | ✅ Yes |
| **MUNICIPAL_OFFICER** | ✅ Yes | ✅ Yes | ✅ Yes |
| **SYSTEM_ADMIN** | ✅ Yes | ✅ Yes | ✅ Yes |

---

## Error Handling

### Image Not Loading
**Trigger:** Image URL returns 404 or fails to load
**Handler:** 
```javascript
onError={(e) => {
  e.target.parentElement.innerHTML = 
    '<div>Image unavailable</div>';
}}
```
**Display:** Shows fallback text instead of broken image

### No Images
**Display:** Shows "📷 No images" placeholder

### No Documents
**Display:** Shows "No documents uploaded" message

---

## Testing Checklist

### Image Display
- [ ] Create listing with images
- [ ] View listing in card view - shows thumbnail
- [ ] Hover over image - zoom effect works
- [ ] Multiple images - shows "+X more" badge
- [ ] View listing detail - shows full gallery
- [ ] Click navigation buttons - switches images
- [ ] Counter shows correct position (e.g., "2/5")

### Document Display (Officer View)
- [ ] Create listing with documents
- [ ] Officer views listing - document count badge shows
- [ ] Officer expands documents - all docs listed
- [ ] Officer clicks download - file downloads
- [ ] Document shows upload date

### Document Display (Buyer View - No Transaction)
- [ ] Buyer views listing - 🔒 "Documents visible to authorized users only"
- [ ] Cannot expand documents
- [ ] Cannot download documents

### Document Display (Buyer View - Completed Transaction)
- [ ] After completing purchase - documents now visible
- [ ] Can expand and view documents
- [ ] Can download documents

### Seller Permissions
- [ ] Owner seller - sees all documents
- [ ] Non-owner seller - cannot see documents

---

## Troubleshooting

### Images Not Showing
1. Check browser console for 404 errors
2. Verify `/uploads/` directory exists on server
3. Check Vite proxy configuration for `/uploads`
4. Ensure images were uploaded successfully (check API response)
5. Check file permissions on `/uploads/` directory

### Documents Not Displaying
1. Check user role and permissions
2. Verify documents were uploaded (check `verification.verificationDocuments` in DB)
3. Check file URLs are correct format
4. Verify static middleware is serving `/uploads/`

### Permission Issues
1. Verify user role in token/session
2. Check transaction status for buyers
3. Check if seller is land owner
4. Review permission logic in `getLandById` controller

---

## Database Fields

### Land Model
```javascript
images: [{
  type: String  // File URL
}],

verification: {
  verificationDocuments: [{
    documentType: String,  // TITLE_DEED, SURVEY_PLAN, etc.
    documentUrl: String,   // File URL
    uploadedAt: Date
  }]
}
```

---

## API Response Examples

### List Endpoint
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "standNumber": "1234A",
      "images": [
        "/uploads/land-images/507f1f77bcf86cd799439011/img-1714953600000.jpg",
        "/uploads/land-images/507f1f77bcf86cd799439011/img-1714953601000.jpg"
      ],
      "verification": {
        "status": "VERIFIED",
        "isVerified": true
      }
    }
  ]
}
```

### Detail Endpoint (Officer)
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "standNumber": "1234A",
    "images": [
      "/uploads/land-images/507f1f77bcf86cd799439011/img-1714953600000.jpg",
      "/uploads/land-images/507f1f77bcf86cd799439011/img-1714953601000.jpg"
    ],
    "verification": {
      "status": "VERIFIED",
      "verificationDocuments": [
        {
          "documentType": "TITLE_DEED",
          "documentUrl": "/uploads/land-documents/507f1f77bcf86cd799439011/TITLE_DEED-1714953600000.pdf",
          "uploadedAt": "2026-05-05T..."
        }
      ]
    }
  }
}
```

### Detail Endpoint (Buyer - No Transaction)
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "standNumber": "1234A",
    "images": [...],
    "verification": {
      "status": "VERIFIED",
      // verificationDocuments is stripped
    }
  }
}
```

---

## Summary of Changes

| Component | Change | Status |
|-----------|--------|--------|
| `LandVerificationCard.jsx` | Added image thumbnail display | ✅ Done |
| `LandDetail.jsx` | Added full image gallery with navigation | ✅ Done |
| `LandVerificationCard.jsx` | Enhanced document display with permissions | ✅ Done |
| `landController.js` | Updated field selection to include images | ✅ Done |
| `landController.js` | Implemented permission-based document stripping | ✅ Done |
| `fileUpload.js` | Proper image storage path handling | ✅ Already exists |
| Backend API | Returns images and documents correctly | ✅ Already exists |

---

## Status: ✅ Complete

All documents and images are now:
- ✅ Properly uploaded and stored
- ✅ Displayed in listing cards with thumbnails
- ✅ Displayed in detail view with full gallery
- ✅ Protected by permission-based access control
- ✅ Download-able by authorized users
- ✅ Properly error-handled

Users can now see all media content with appropriate permissions! 🎉
