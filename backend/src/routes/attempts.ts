/**
 * @file attempts.ts
 * @description Defines routes for managing individual exam attempts.
 * Handles the session lifecycle from initialization to final submission.
 */

import { Router } from 'express';
import { 
  startAttempt, 
  saveAnswer, 
  submitAttempt, 
  getMyAttempts, 
  getAttemptDetails,
  trackPaste,
  trackTabSwitch 
} from '../controllers/attemptController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * Core Attempt Lifecycle
 * ----------------------
 */

// Initialize a new exam session for the current user
router.post('/start', authenticate, startAttempt);

// Save progress for an individual question during the test
router.post('/save-answer', authenticate, saveAnswer);

// Finalize the attempt and trigger the evaluation engine
router.post('/submit', authenticate, submitAttempt);

/**
 * Historical Data Retrieval
 * ------------------------
 */

// View a list of the user's completed submissions
router.get('/my-attempts', authenticate, getMyAttempts);

// View details for a specific historical attempt
router.get('/:id', authenticate, getAttemptDetails);

/**
 * Integrity & Proctoring Events
 * ----------------------------
 */

// Silently log whenever a user attempts to paste text into an answer
router.post('/track-paste', authenticate, trackPaste);

// Silently log whenever a user switches browser tabs during the test
router.post('/track-tab-switch', authenticate, trackTabSwitch);

export default router;

