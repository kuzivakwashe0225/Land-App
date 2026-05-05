# LandSolutions System Correction Implementation Guide

**Priority Level:** CRITICAL - Complete System Refactoring

---

## Phase 1: Backend Infrastructure ✅ COMPLETED

### 1.1 Authority Records Model ✅
**File:** `server/models/authority-records-model.js`
- Simulates official council/deeds records
- Fields: standNumber, ownerFullName, nationalId, location, gpsCoordinates, status, etc.
- Indexes for fast querying

### 1.2 RBAC Middleware ✅
**File:** `server/middlewares/rbac-middleware.js`
- Defines 6 roles: BUYER, SELLER, VERIFICATION_OFFICER, MUNICIPAL_OFFICER, ADMIN, SYSTEM_ADMIN
- Export functions: `requireRole()`, `requirePermission()`
- Use in routes: `router.post('/approve', requireRole('ADMIN'), approveLandListing)`

### 1.3 Verification Scoring Service ✅
**File:** `server/services/verificationScoringService.js`
- Compares seller data vs authority records
- Calculates verification score (0-100%)
- Methods:
  - `compareWithAuthority()` - Main comparison logic
  - `checkForDuplicates()` - Find duplicate listings
  - `compareNames()` - Fuzzy name matching
  - `calculateDistance()` - GPS accuracy check

### 1.4 Fraud Risk Scoring Service ✅
**File:** `server/services/fraudRiskScoringService.js`
- Detects 14+ suspicious patterns
- Calculates fraud risk (0-100%)
- Returns risk level: LOW_RISK, MEDIUM_RISK, HIGH_RISK, CRITICAL_RISK
- Methods:
  - `calculateFraudRisk()` - Main scoring
  - `getFinalRecommendation()` - Combines verification + fraud scores

### 1.5 Audit Logging ✅
**Files:** 
- `server/models/audit-log-model.js` - Schema
- `server/services/auditLogService.js` - Service
- Tracks all admin actions
- 90-day auto-expiration
- Export to CSV for compliance

### 1.6 Authority Records Seed Data ✅
**File:** `server/scripts/seed-authority-records.js`
- 8 dummy authority records (various statuses)
- Run: `node server/scripts/seed-authority-records.js`

---

## Phase 2: API Endpoints (NEXT - CRITICAL)

### 2.1 Update Verification Controller
**File:** `server/controllers/verificationController.js`

**Required Changes:**

```javascript
import verificationScoringService from '../services/verificationScoringService.js';
import fraudRiskScoringService from '../services/fraudRiskScoringService.js';
import auditLogService from '../services/auditLogService.js';

// Update performStandVerification to:
// 1. Call verificationScoringService.compareWithAuthority()
// 2. Call fraudRiskScoringService.calculateFraudRisk()
// 3. Call fraudRiskScoringService.getFinalRecommendation()
// 4. Log action with auditLogService
// 5. Return detailed report with scores + factors

export const performStandVerification = async (req, res) => {
  const { landId } = req.params;
  const land = await Land.findById(landId).populate('owner');

  // Get verification score from authority database
  const verificationResult = await verificationScoringService.compareWithAuthority({
    standNumber: land.standNumber,
    titleDeedNumber: land.titleDeedNumber,
    ownerName: `${land.owner.firstName} ${land.owner.lastName}`,
    nationalId: land.owner.nationalId,
    standSize: land.landDetails.size.squareMeters,
    suburb: land.location.address.suburb,
    latitude: land.location.coordinates.latitude,
    longitude: land.location.coordinates.longitude
  });

  // Get fraud risk score
  const fraudRiskResult = await fraudRiskScoringService.calculateFraudRisk({
    // Pass relevant fields
  });

  // Get final recommendation
  const finalDecision = fraudRiskScoringService.getFinalRecommendation(
    verificationResult.score,
    fraudRiskResult.score
  );

  // Log action
  await auditLogService.logVerificationAction(req, landId, 'VERIFICATION_RUN', {
    verificationScore: verificationResult.score,
    fraudRiskScore: fraudRiskResult.score
  });

  return res.status(200).json({
    success: true,
    verificationScore: verificationResult.score,
    verificationDetails: verificationResult,
    fraudRiskScore: fraudRiskResult.score,
    fraudRiskFactors: fraudRiskResult.factors,
    finalRecommendation: finalDecision
  });
};

// Update approveLandListing to:
// 1. Check role (requireRole('ADMIN', 'VERIFICATION_OFFICER'))
// 2. Verify score >= 70
// 3. Log approval
// 4. Send notification
// 5. Create notification in database

export const approveLandListing = async (req, res) => {
  // Check permissions first
  if (!hasPermission(req.user.role, 'canApproveListings')) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  // ... rest of logic
  
  // Log approval
  await auditLogService.logVerificationAction(req, landId, 'VERIFIED', {
    reason: req.body.adminNotes,
    verificationScore: land.verification.verificationResult.authenticationScore
  });

  // ... send notification
};

// Update rejectLandListing similarly
export const rejectLandListing = async (req, res) => {
  if (!hasPermission(req.user.role, 'canRejectListings')) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }

  // ... rest of logic
  
  await auditLogService.logVerificationAction(req, landId, 'REJECTED', {
    reason: req.body.reason,
    adminNotes: req.body.adminNotes
  });
};
```

### 2.2 Create Dashboard Stats Endpoint
**File:** `server/controllers/dashboardController.js` (NEW)

```javascript
export const getDashboardStats = async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.countDocuments(),
      totalSellers: await User.countDocuments({ role: 'SELLER', 'verification.kycStatus': 'APPROVED' }),
      totalBuyers: await User.countDocuments({ role: 'BUYER' }),
      totalListings: await Land.countDocuments(),
      pendingListings: await Land.countDocuments({ 'verification.status': 'PENDING' }),
      verifiedListings: await Land.countDocuments({ 'verification.status': 'VERIFIED' }),
      rejectedListings: await Land.countDocuments({ 'verification.status': 'REJECTED' }),
      suspiciousListings: await Land.countDocuments({ 'fraudFlags': { $exists: true, $ne: [] } }),
      totalReports: await Report.countDocuments(),
      unresolvedReports: await Report.countDocuments({ status: { $ne: 'RESOLVED' } })
    };

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### 2.3 Create Listing Details Endpoint
**File:** `server/controllers/landController.js` - Add new method

```javascript
export const getListingDetails = async (req, res) => {
  try {
    const { landId } = req.params;
    
    const land = await Land.findById(landId)
      .populate('owner', 'firstName lastName email phoneNumber')
      .populate('verification.verifiedBy', 'firstName lastName');

    if (!land) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Only verified listings shown to public
    if (land.verification.status !== 'VERIFIED' && req.user?.role === 'BUYER') {
      return res.status(403).json({ success: false, message: 'Listing not yet verified' });
    }

    res.status(200).json({
      success: true,
      data: {
        id: land._id,
        standNumber: land.standNumber,
        titleDeed: land.titleDeedNumber,
        price: land.transaction.listedPrice.amount,
        size: land.landDetails.size.squareMeters,
        zoning: land.landDetails.zoning,
        landUse: land.landDetails.landUse,
        location: land.location,
        owner: land.owner,
        status: land.verification.status,
        verificationScore: land.verification.verificationResult?.authenticationScore,
        fraudFlags: land.fraudFlags,
        images: land.images || [],
        documents: land.verification.verificationDocuments,
        createdAt: land.createdAt,
        verificationDate: land.verification.verificationDate
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### 2.4 Register New Routes
**File:** `server/index.js`

```javascript
import auditLogRouter from './routes/audit-log-route.js';
import dashboardRouter from './routes/dashboard-route.js';

// Add to routes section:
app.use('/api/audit-logs', auditLogRouter);
app.use('/api/dashboard', dashboardRouter);

// Update existing land routes:
app.get('/api/land/:landId', verifyUser, landController.getListingDetails);
app.post('/api/verification/verify/:landId', requireRole('ADMIN', 'VERIFICATION_OFFICER'), performStandVerification);
```

---

## Phase 3: Frontend Fixes (CRITICAL)

### 3.1 Add Toast Notifications
**Install Package:**
```bash
npm install react-hot-toast
```

**Setup in `client/src/App.jsx`:**
```jsx
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      {/* Rest of app */}
    </>
  );
}
```

**Usage Everywhere:**
```jsx
import toast from 'react-hot-toast';

// Success
toast.success('Stand submitted successfully');

// Error
toast.error('Failed to upload document');

// Loading
const id = toast.loading('Processing...');
toast.success('Done', { id });
```

### 3.2 Fix All Button Behaviors
**Pattern to Use:**
```jsx
const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    setLoading(true);
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
    
    const result = await response.json();
    
    if (!result.success) {
      toast.error(result.message);
      setLoading(false);
      return;
    }
    
    toast.success('Action completed!');
    // Redirect or refresh
    navigate('/page');
    // Or refresh data
    fetchData();
  } catch (error) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};
```

### 3.3 Create Listing Details Page
**File:** `client/src/pages/ListingDetails.jsx` (NEW)

```jsx
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

function ListingDetails() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const response = await fetch(`/api/land/${id}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setListing(data.data);
      }
    } catch (error) {
      console.error('Error fetching listing:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!listing) return <div>Listing not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1>{listing.standNumber}</h1>
      <p>Price: ${listing.price}</p>
      <p>Size: {listing.size} sqm</p>
      <p>Status: <span className="badge">{listing.status}</span></p>
      
      {/* Map */}
      <MapContainer center={[listing.location.coordinates.latitude, listing.location.coordinates.longitude]} zoom={16}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[listing.location.coordinates.latitude, listing.location.coordinates.longitude]}>
          <Popup>{listing.standNumber}</Popup>
        </Marker>
      </MapContainer>

      {/* Owner Info */}
      <div className="border p-4 mt-4">
        <h3>Owner</h3>
        <p>{listing.owner.firstName} {listing.owner.lastName}</p>
        <p>{listing.owner.email}</p>
      </div>

      {/* Documents */}
      <div className="border p-4 mt-4">
        <h3>Documents</h3>
        {listing.documents?.map(doc => (
          <a href={doc.documentUrl} key={doc._id}>
            Download {doc.documentType}
          </a>
        ))}
      </div>

      {/* Inquiry Button */}
      <button className="bg-blue-600 text-white px-6 py-2 mt-4">
        Send Inquiry
      </button>
    </div>
  );
}

export default ListingDetails;
```

### 3.4 Update Land Listings Page
**File:** `client/src/pages/LandListings.jsx` - Fix to show ONLY verified listings for buyers

```jsx
const fetchListings = async () => {
  try {
    const userRole = /* get from redux */;
    
    let url = '/api/land';
    
    // Buyers only see verified listings
    if (userRole === 'BUYER') {
      url += '?status=VERIFIED';
    }
    
    const response = await fetch(url, { credentials: 'include' });
    const data = await response.json();
    
    if (data.success) {
      setListings(data.data);
    }
  } catch (error) {
    toast.error('Failed to load listings');
  }
};
```

### 3.5 Create Listing Submission Wizard
**File:** `client/src/components/ListingWizard.jsx` (NEW)

```jsx
import { useState } from 'react';
import Step1BasicInfo from './wizard/Step1BasicInfo';
import Step2Location from './wizard/Step2Location';
import Step3Documents from './wizard/Step3Documents';
import Step4Review from './wizard/Step4Review';
import Step5Result from './wizard/Step5Result';
import toast from 'react-hot-toast';

function ListingWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    standNumber: '',
    titleDeedNumber: '',
    price: '',
    size: '',
    address: '',
    suburb: '',
    coordinates: { lat: null, lng: null },
    documents: [],
    zoning: '',
    landUse: ''
  });
  const [result, setResult] = useState(null);

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/land', {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: 'Stand submitted for verification',
          landId: data.data._id
        });
        setStep(5);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to submit listing');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3, 4, 5].map(s => (
          <div key={s} className={`h-2 flex-1 mx-1 ${s <= step ? 'bg-blue-600' : 'bg-gray-300'}`} />
        ))}
      </div>

      {/* Step Content */}
      {step === 1 && <Step1BasicInfo data={formData} setData={setFormData} />}
      {step === 2 && <Step2Location data={formData} setData={setFormData} />}
      {step === 3 && <Step3Documents data={formData} setData={setFormData} />}
      {step === 4 && <Step4Review data={formData} />}
      {step === 5 && <Step5Result result={result} />}

      {/* Navigation */}
      {step < 5 && (
        <div className="flex gap-4 mt-8">
          <button onClick={handlePrev} disabled={step === 1} className="px-6 py-2 border">
            Previous
          </button>
          <button onClick={step === 4 ? handleSubmit : handleNext} className="px-6 py-2 bg-blue-600 text-white">
            {step === 4 ? 'Submit' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
}

export default ListingWizard;
```

### 3.6 Implement Map with Geocoding
**Install Package:**
```bash
npm install react-leaflet leaflet leaflet-geocoder
```

**Create Map Component:**
```jsx
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useEffect, useState } from 'react';

function MapSelector({ onCoordinatesSelected }) {
  const [position, setPosition] = useState([-17.825, 31.033]); // Default to Harare

  const MapEvents = () => {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);

        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await response.json();
          
          onCoordinatesSelected({
            lat,
            lng,
            address: data.address?.road || '',
            suburb: data.address?.suburb || data.address?.town || '',
            formattedAddress: data.display_name
          });
        } catch (error) {
          console.error('Geocoding error:', error);
        }
      }
    });
    return null;
  };

  return (
    <MapContainer center={position} zoom={16} style={{ height: '400px' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={position} />
      <MapEvents />
    </MapContainer>
  );
}

export default MapSelector;
```

---

## Phase 4: Database Updates

### 4.1 Update Land Model Statuses
**File:** `server/models/landModel.js` - Update verification.status enum:

```javascript
status: {
  type: String,
  enum: ['DRAFT', 'SUBMITTED', 'PENDING_VERIFICATION', 'AUTO_VERIFIED', 'REQUIRES_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPICIOUS', 'REMOVED'],
  default: 'DRAFT'
}
```

### 4.2 Seed Authority Records
```bash
cd server
node scripts/seed-authority-records.js
```

---

## Phase 5: Integration Checklist

- [ ] Implement Phase 1 backend (DONE)
- [ ] Create dashboard endpoint
- [ ] Update verification controller to use scoring services
- [ ] Add audit logging to all admin actions
- [ ] Protect routes with RBAC
- [ ] Install react-hot-toast
- [ ] Add toast notifications throughout
- [ ] Fix all button behaviors
- [ ] Create listing details page  
- [ ] Create listing wizard
- [ ] Implement map component
- [ ] Hide verification buttons from buyers/sellers
- [ ] Show only verified listings to buyers
- [ ] Make dashboard cards clickable
- [ ] Update landing page
- [ ] Test complete workflow
- [ ] Run test suite

---

## Critical Fixes Summary

| Issue | Solution | Priority |
|-------|----------|----------|
| No government database | Use simulated authority_records | CRITICAL |
| No RBAC | Implemented in rbac-middleware.js | CRITICAL |
| No verification logic | Created verificationScoringService.js | CRITICAL |
| No fraud detection | Created fraudRiskScoringService.js | CRITICAL |
| No audit trail | Created auditLogService.js | CRITICAL |
| No toast notifications | Use react-hot-toast | HIGH |
| No listing details page | Create ListingDetails.jsx | HIGH |
| No geocoding | Use Nominatim + Leaflet | HIGH |
| Broken buttons | Implement proper loading/error states | HIGH |
| Static dashboard | Create dynamic dashboard endpoint | HIGH |

---

## Next Steps

1. **This Session:** Complete Phase 1 ✅ + Phase 2
2. **Frontend Team:** Implement Phase 3 frontend components
3. **Testing:** Run full workflow test
4. **Deployment:** Deploy to production with new system

---

## Support Resources

- Backend services location: `server/services/`
- Models location: `server/models/`
- RBAC usage: `server/middlewares/rbac-middleware.js`
- Example frontend: Check `client/src/pages/` for patterns

**System is now verification-first, fraud-aware, and role-controlled!** 🚀
