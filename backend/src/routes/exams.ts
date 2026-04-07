/**
 * @file exams.ts
 * @description Defines routes for managing and taking exams.
 * Split between user-facing retrieval and admin-facing CRUD operations.
 */

import { Router } from 'express';
import { 
  getExams, 
  getExam, 
  createExam, 
  updateExam, 
  deleteExam,
  getAllExamsAdmin 
} from '../controllers/examController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * User Routes
 * -----------
 * Accessible to any authenticated user.
 */

// List all active exams available to take
router.get('/', authenticate, getExams);

// Get structure and questions for a specific exam
router.get('/:id', authenticate, getExam);

/**
 * Admin Routes
 * ------------
 * Require both authentication and administrative privileges.
 */

// List all exams (including inactive ones) with counts and stats
router.get('/admin/all', authenticate, requireAdmin, getAllExamsAdmin);

// Create a new exam from scratch
router.post('/', authenticate, requireAdmin, createExam);

// Update details for an existing exam
router.put('/:id', authenticate, requireAdmin, updateExam);

// Permanently remove an exam from the system
router.delete('/:id', authenticate, requireAdmin, deleteExam);

export default router;

