import express from 'express';
import {
  createAdminAccount,
  getAllUsers,
  suspendUser,
  deleteUserAccount,
  changeUserRole,
  getAdminDashboard
} from '../controllers/admin-controller.js';
import { authenticateToken } from '../middlewares/auth-middleware.js';

const router = express.Router();

// All admin routes require authentication
router.use(authenticateToken);

// Create admin account (SYSTEM_ADMIN only)
router.post('/create-admin', createAdminAccount);

// Get all users (SYSTEM_ADMIN only)
router.get('/users', getAllUsers);

// Suspend/unsuspend user (SYSTEM_ADMIN only)
router.post('/suspend-user', suspendUser);

// Delete user (SYSTEM_ADMIN only)
router.post('/delete-user', deleteUserAccount);

// Change user role (SYSTEM_ADMIN only)
router.post('/change-role', changeUserRole);

// Get dashboard statistics
router.get('/dashboard/stats', getAdminDashboard);

export default router;
