/**
 * @file admin.ts
 * @description Defines the routing for administrative tasks.
 * All routes in this file require both authentication and admin privileges.
 */

import { Router } from 'express';
import { 
  getAllUsers, 
  getUserDetails, 
  resetAttempts, 
  updateUserStatus,
  getPlagiarismReports,
  getAnalytics,
  getAdminActions,
  getDisqualifiedUsers,
  getQualifiedUsers,
  exportQualifiedUsers,
  exportDisQualifiedUsers,
  adminVerifyUser,
  deleteUser
} from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * User Management Routes
 * ----------------------
 */

// Retrieve a list of all registered users
router.get('/users', authenticate, requireAdmin, asyncHandler(getAllUsers as any));

// Retrieve detailed profile and history for a specific user
router.get('/users/:id', authenticate, requireAdmin, asyncHandler(getUserDetails as any));

// Delete a user from the system
router.delete('/users/:id', authenticate, requireAdmin, asyncHandler(deleteUser as any));

// Manually reset a user's attempt count (e.g. after a technical failure)
router.post('/reset-attempts', authenticate, requireAdmin, asyncHandler(resetAttempts as any));

// Change a user's status (e.g. block/disqualify or reactivate)
router.post('/update-status', authenticate, requireAdmin, asyncHandler(updateUserStatus as any));

/**
 * Monitoring & Analytics Routes
 * ---------------------------
 */

// View a list of all flagged plagiarism incidents
router.get('/plagiarism-reports', authenticate, requireAdmin, asyncHandler(getPlagiarismReports as any));

// View high-level system analytics (pass rates, active users, etc.)
router.get('/analytics', authenticate, requireAdmin, asyncHandler(getAnalytics as any));

// View the audit log of all administrative actions taken
router.get('/actions', authenticate, requireAdmin, asyncHandler(getAdminActions as any));

// View qualified users
router.get('/qualified-users', authenticate, requireAdmin, asyncHandler(getQualifiedUsers as any));

// View disqualified users
router.get('/disqualified-users', authenticate, requireAdmin, asyncHandler(getDisqualifiedUsers as any));

// Export qualified users
router.get('/export-qualified', authenticate, requireAdmin, asyncHandler(exportQualifiedUsers as any));

// Export disqualified users
router.get('/export-disqualified', authenticate, requireAdmin, asyncHandler(exportDisQualifiedUsers as any));

// Manually verify a user (NIN, email, phone)
router.post('/verify-user', authenticate, requireAdmin, asyncHandler(adminVerifyUser as any));

export default router;

