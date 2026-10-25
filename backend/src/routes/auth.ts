/**
 * @file auth.ts
 * @description Defines routes for user identity management.
 * Includes public registration/login and protected profile retrieval.
 */

import { Router } from 'express';
import { register, login, getMe, sendOtp, verifyOtpHandler } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Public: Create a new account
router.post('/register', asyncHandler(register as any));

// Public: Log in and receive a session token
router.post('/login', asyncHandler(login as any));

// Protected: Get current user profile based on JWT session
router.get('/me', authenticate, asyncHandler(getMe as any));

router.post('/send-otp', authenticate, asyncHandler(sendOtp as any));

router.post('/verify-otp', authenticate, asyncHandler(verifyOtpHandler as any));


export default router;

