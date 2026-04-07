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
  getAdminActions
} from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * User Management Routes
 * ----------------------
 */

// Retrieve a list of all registered users
router.get('/users', authenticate, requireAdmin, getAllUsers);

// Retrieve detailed profile and history for a specific user
router.get('/users/:id', authenticate, requireAdmin, getUserDetails);

// Manually reset a user's attempt count (e.g. after a technical failure)
router.post('/reset-attempts', authenticate, requireAdmin, resetAttempts);

// Change a user's status (e.g. block/disqualify or reactivate)
router.post('/update-status', authenticate, requireAdmin, updateUserStatus);

/**
 * Monitoring & Analytics Routes
 * ---------------------------
 */

// View a list of all flagged plagiarism incidents
router.get('/plagiarism-reports', authenticate, requireAdmin, getPlagiarismReports);

// View high-level system analytics (pass rates, active users, etc.)
router.get('/analytics', authenticate, requireAdmin, getAnalytics);

// View the audit log of all administrative actions taken
router.get('/actions', authenticate, requireAdmin, getAdminActions);

export default router;

