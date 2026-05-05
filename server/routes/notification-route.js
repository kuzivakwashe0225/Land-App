import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotificationById
} from '../controllers/notificationController.js';
import { verifyUser } from '../middlewares/auth-middleware.js';

const router = express.Router();

// All notification routes require authentication
router.use(verifyUser);

// Get all notifications for current user
router.get('/', getNotifications);

// Get unread notification count
router.get('/unread/count', getUnreadCount);

// Get notification by ID and mark as read
router.get('/:notificationId', getNotificationById);

// Mark a notification as read
router.put('/:notificationId/read', markAsRead);

// Mark all notifications as read
router.put('/read/all', markAllAsRead);

// Delete a notification
router.delete('/:notificationId', deleteNotification);

// Delete all notifications
router.delete('/delete/all', deleteAllNotifications);

export default router;
