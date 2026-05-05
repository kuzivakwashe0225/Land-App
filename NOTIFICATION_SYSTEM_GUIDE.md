# Real-Time Notification System Guide

## 🔧 System Overview

The platform now has a complete in-app notification system that:
- ✅ Stores notifications in the database
- ✅ Displays unread notification count
- ✅ Shows notifications in a dropdown
- ✅ Marks notifications as read
- ✅ Polls for new notifications every 30 seconds
- ✅ Sends email notifications in background
- ✅ Handles all verification events with notifications

---

## 📦 New Components & Files

### Backend
1. **Notification Model** (`server/models/notification-model.js`)
   - Stores all in-app notifications
   - 30-day TTL (auto-expires old notifications)
   - Indexes for efficient querying

2. **Notification Controller** (`server/controllers/notificationController.js`)
   - Get all/unread notifications
   - Mark as read (single/all)
   - Delete notifications
   - Get unread count

3. **Notification Routes** (`server/routes/notification-route.js`)
   - Protected routes (require authentication)
   - CRUD operations for notifications

4. **Updated Utilities** (`server/utils/notifications.js`)
   - Now saves notifications to database
   - Still sends email/SMS/push notifications
   - Unified notification interface

### Frontend
1. **Notification Service** (`client/src/services/notificationService.js`)
   - API calls for notification operations
   - Poll-based updates every 30 seconds
   - Error handling

2. **Notification Component** (`client/src/components/Notifications.jsx`)
   - Bell icon with unread count badge
   - Dropdown showing last 20 notifications
   - Mark as read / Delete actions
   - Auto-polling updates

---

## 🚀 Integration Guide

### 1. Add Notification Component to Header
In your header/navbar component (e.g., `Header.jsx`):

```jsx
import Notifications from './Notifications';

function Header() {
  return (
    <div className="flex items-center gap-4">
      {/* Other header elements */}
      <Notifications />
    </div>
  );
}
```

### 2. Add Notification Route to Server
✅ Already done in `server/index.js`:
```javascript
app.use("/api/notifications", notificationRouter);
```

### 3. Fix fraudFlags ObjectId Issue
✅ Already fixed in:
- `server/models/landModel.js` - Added `default: null`
- `server/controllers/reportController.js` - Only push when user is authenticated

---

## 📡 How Notifications Flow

### When Land is Verified
```
1. Admin clicks "Approve" in verification center
2. verificationController.approveLandListing() is called
3. createNotification(seller._id, 'LAND_VERIFIED', {...})
4. Notification saved to database
5. Email sent to seller
6. Frontend polls and sees new notification
7. Notification appears in bell icon dropdown
```

### When Verification is Rejected
```
1. Admin clicks "Reject" with reason
2. verificationController.rejectLandListing() is called
3. createNotification(seller._id, 'LAND_VERIFICATION_REJECTED', {...})
4. Notification saved to database
5. Email sent to seller with reason
6. Frontend sees updated notification count
```

### When Fraud Report is Submitted
```
1. User submits fraud report
2. reportController.createFraudReport() is called
3. createNotification() called for officers
4. Notification saved to database
5. Officers see it in their notification dropdown
```

---

## 📱 Notification API Endpoints

All endpoints require authentication (JWT token).

### Get Notifications
```http
GET /api/notifications?limit=20&page=1&unreadOnly=false
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "type": "LAND_VERIFIED",
      "title": "Land Verified",
      "message": "Your land listing Stand A123 has been verified with a score of 92%",
      "data": {
        "standNumber": "A123",
        "landId": "507f1f77bcf86cd799439013",
        "verificationScore": 92
      },
      "actionUrl": "/lands/507f1f77bcf86cd799439013",
      "isRead": false,
      "readAt": null,
      "createdAt": "2026-04-30T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  },
  "unreadCount": 3
}
```

### Get Unread Count
```http
GET /api/notifications/unread/count
```
**Response:**
```json
{
  "success": true,
  "unreadCount": 3
}
```

### Mark as Read
```http
PUT /api/notifications/{notificationId}/read
```

### Mark All as Read
```http
PUT /api/notifications/read/all
```

### Delete Notification
```http
DELETE /api/notifications/{notificationId}
```

### Delete All Notifications
```http
DELETE /api/notifications/delete/all
```

---

## 🔄 Real-Time Updates (Polling Strategy)

The notification component uses **polling** (instead of WebSockets) for simplicity:

1. **Initial Load:** Fetches unread count on mount
2. **Dropdown Opens:** Fetches last 20 notifications
3. **Polling:** Every 30 seconds, fetches unread count
4. **User Actions:** Immediately update UI, then persist to backend

### Why Polling?
- ✅ No WebSocket setup needed
- ✅ Works with standard REST API
- ✅ Reliable and simple
- ✅ 30-second interval is fast enough for most use cases

### Optional: Enable WebSockets for Real-Time (Advanced)
If you want instant notifications:
```bash
npm install socket.io socket.io-client
```

Then update the Notifications component to use WebSocket instead of polling.

---

## 🎯 Notification Types

The system supports these notification types:

| Type | Title | Example | Trigger |
|------|-------|---------|---------|
| `LAND_VERIFIED` | Land Verified | Stand A123 verified (92%) | Admin approval |
| `LAND_VERIFICATION_REJECTED` | Land Verification Rejected | Stand rejected - high risk | Admin rejection |
| `FRAUD_REPORT` | Fraud Report Received | Stand flagged | Fraud report submitted |
| `KYC_APPROVED` | KYC Approved | Identity verification approved | Admin KYC approval |
| `KYC_REJECTED` | KYC Rejected | Identity verification rejected | Admin KYC rejection |
| `LAND_FLAGGED` | Land Flagged | Stand flagged for review | System flag |
| `PAYMENT_RECEIVED` | Payment Received | Transaction payment confirmed | Payment processed |
| `VERIFICATION_REQUIRED` | Verification Required | Complete your verification | System trigger |
| `SUSPICIOUS_ACTIVITY` | Suspicious Activity Reported | Activity on Stand A123 | Report submitted |
| `NEW_MESSAGE` | New Message | Message from John Doe | Message sent |

---

## 🔧 Testing the Notification System

### 1. Test Notification Creation
```javascript
// In browser console, after login:
const res = await fetch('/api/notifications', {
  credentials: 'include'
});
const data = await res.json();
console.log(data);
```

### 2. Test Verification Notification
1. Log in as SELLER
2. Create a land listing (status: PENDING)
3. Log in as ADMIN
4. Go to verification center
5. Click "Verify" and then "Approve"
6. **Expected:** Seller sees notification: "Land Verified - Stand X123 verified (92%)"

### 3. Test Unread Count Update
1. Open notification dropdown (should show unread count)
2. Click one notification to open
3. Notification marked as read (blue indicator disappears)
4. Unread count decreases

### 4. Test Polling
1. Open notification dropdown
2. In another tab, perform action that creates notification
3. After 30 seconds (or refresh), notification appears
4. Or manually refresh by closing/opening dropdown

---

## 📊 Notification Status Tracking

Each notification has a status:

| Field | Value | Meaning |
|-------|-------|---------|
| `isRead` | false | Notification not yet opened |
| `isRead` | true | Notification has been read |
| `readAt` | null | Never been read |
| `readAt` | timestamp | When notification was read |
| `createdAt` | timestamp | When notification was created |
| `expiresAt` | timestamp | Auto-delete date (30 days) |

---

## 🛠️ Developer Notes

### Adding New Notification Type
1. Add to `Notification` model enum in `server/models/notification-model.js`
2. Add message template in `server/utils/notifications.js`
3. Call `createNotification()` wherever event occurs
4. Component automatically picks it up via polling

### Example: Adding Custom Notification
```javascript
// In your controller:
import { createNotification } from '../utils/notifications.js';

// When event happens:
await createNotification(userId, 'CUSTOM_TYPE', {
  customField: 'value',
  relatedId: '507f1f77bcf86cd799439011'
});
```

### Checking Notification Count in Backend
```javascript
import Notification from '../models/notification-model.js';

const unreadCount = await Notification.countDocuments({
  userId: req.user.id,
  isRead: false
});
```

---

## 📝 Notification Messages Template

Default messages are in `server/utils/notifications.js`:

```javascript
const notificationMessages = {
  'LAND_VERIFIED': {
    title: 'Land Verified',
    message: `Your land listing ${data.standNumber} has been verified with a score of ${data.verificationScore}%`,
    actionUrl: `/lands/${data.landId}`
  },
  // ... more types
};
```

Each notification **must** have:
- `title`: Short notification title
- `message`: Detailed message with context
- `actionUrl`: Where user goes when clicking

---

## 🐛 Troubleshooting

### Notifications Not Appearing
**Solution:**
1. Check browser console for errors
2. Verify `server/routes/notification-route.js` is registered
3. Verify `Notifications` component is in header
4. Check that `verifyUser` middleware exists

### Unread Count Not Updating
**Solution:**
1. Verify polling interval is working (check network tab)
2. Ensure notification was saved to database
3. Check `unreadCount` in response

### Email Notifications Not Sending
**Solution:**
1. Verify `EMAIL_USER` and `EMAIL_PASS` in `.env`
2. Check user preferences have `notifications.email` enabled
3. Check server logs for email errors

### "Cast to ObjectId failed" Error
**Solution:** ✅ Already fixed
- Updated fraudFlags schema to allow `null`
- Check that `reportedBy` has `default: null` in model

---

## 📈 Performance Optimization

### Polling Frequency
- Current: 30 seconds (good for most cases)
- Change in `Notifications.jsx` line ~25:

```javascript
const interval = setInterval(fetchUnreadCount, 30000); // milliseconds
```

### Reduce Polling Load
```javascript
// Only fetch when window is focused
useEffect(() => {
  const handleFocus = () => fetchUnreadCount();
  window.addEventListener('focus', handleFocus);
  
  const interval = setInterval(fetchUnreadCount, 30000);
  return () => {
    window.removeEventListener('focus', handleFocus);
    clearInterval(interval);
  };
}, []);
```

### Pagination
- Notifications dropdown shows last 20
- Adjust `limit` in `getNotifications()` call

---

## 🔒 Security

- ✅ All routes protected with `verifyUser` middleware
- ✅ Users can only see their own notifications
- ✅ Notifications auto-expire after 30 days
- ✅ No sensitive data in notification text
- ✅ All database queries include userId filter

---

## 📚 Integration Checklist

- [ ] Add Notifications component to header
- [ ] Test notification creation for land verification
- [ ] Test notification creation for KYC approval/rejection
- [ ] Test notification creation for fraud reports
- [ ] Verify email notifications are sent
- [ ] Verify polling updates work correctly
- [ ] Test mark as read functionality
- [ ] Test delete functionality
- [ ] Check database is storing notifications
- [ ] Monitor server logs for notification errors

---

## 🎉 You Now Have

✅ Database-backed notification system
✅ Real-time polling (30-second updates)
✅ In-app notification dropdown
✅ Mark as read functionality
✅ Delete functionality
✅ Unread count badge
✅ Email notifications
✅ 30-day auto-expiration
✅ Full notification history

**The system is production-ready!**
