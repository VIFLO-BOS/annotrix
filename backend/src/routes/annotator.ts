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

const router = Router();

// Retrieve summary statistics (eligibility, attempt counts, last score)
router.get('/stats', authenticate, getDashboardStats);

// Retrieve a list of all historical scores for the current user
router.get('/scores', authenticate, getMyScores);

// Retrieve the detailed evaluation breakdown for a specific score
router.get('/scores/:id', authenticate, getScoreDetails);

export default router;

