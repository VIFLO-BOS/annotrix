/**
 * @file auth.ts
 * @description Defines routes for user identity management.
 * Includes public registration/login and protected profile retrieval.
 */

import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public: Create a new account
router.post('/register', register);

// Public: Log in and receive a session token
router.post('/login', login);

// Protected: Get current user profile based on JWT session
router.get('/me', authenticate, getMe);

export default router;

