/**
 * @file annotator.ts
 * @description Defines routes for the user-facing dashboard.
 * Provides access to aggregated performance statistics and historical scores.
 */

import { Router } from 'express';
import { 
  getDashboardStats, 
  getMyScores, 
  getScoreDetails 
} from '../controllers/annotatorController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Retrieve summary statistics (eligibility, attempt counts, last score)
router.get('/stats', authenticate, asyncHandler(getDashboardStats as any));

// Retrieve a list of all historical scores for the current user
router.get('/scores', authenticate, asyncHandler(getMyScores as any));

// Retrieve the detailed evaluation breakdown for a specific score
router.get('/scores/:id', authenticate, asyncHandler(getScoreDetails as any));

export default router;

