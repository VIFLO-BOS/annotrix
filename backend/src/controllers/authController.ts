/**
 * @file authController.ts
 * @description Controllers for user authentication, including registration, 
 * login, and retrieving the current user's profile.
 */

import { Response } from 'express';
import { AuthenticatedRequest, RegisterInput, LoginInput } from '../types';
import { prisma } from '../utils/prisma';
import { generateToken, hashPassword, verifyPassword } from '../utils/auth';
import { registerSchema, loginSchema } from '../utils/validation';

/**
 * Registers a new user in the system.
 * Validates the input, checks for existing emails, hashes the password, 
 * and returns a signed JWT.
 * 
 * @param req - Request containing registration details (fullName, email, etc.)
 * @param res - Response with user profile and auth token
 */
export const register = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Step 1: Validate input data against the schema
    const validatedData = registerSchema.parse(req.body) as RegisterInput;

    // Step 2: Ensure the email is not already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // Step 3: Securely hash the selected password
    const hashedPassword = hashPassword(validatedData.password);

    // Step 4: Create the user record in the database
    // Note: We use 'select' here to ensure we don't return the hashed password string
    const user = await prisma.user.create({
      data: {
        fullName: validatedData.fullName,
        email: validatedData.email,
        phone: validatedData.phone,
        password: hashedPassword,
        role: 'USER', // Default role for new signups
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        attempts: true,
        maxAttempts: true,
        createdAt: true,
      },
    });

    // Step 5: Generate a JWT for the newly created user
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Authenticates an existing user.
 * Verifies credentials and returns a new session token.
 * 
 * @param req - Request containing email and password
 * @param res - Response with user profile and session token
 */
export const login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Step 1: Validate input
    const validatedData = loginSchema.parse(req.body) as LoginInput;

    // Step 2: Find the user by their unique email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Step 3: Compare provided password with the stored hash
    const isValidPassword = verifyPassword(validatedData.password, user.password);

    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Step 4: Generate a JWT if credentials are correct
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Step 5: Send back a sanitized user object (no password)
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        attempts: user.attempts,
        maxAttempts: user.maxAttempts,
      },
      token,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieves the profile of the currently authenticated user.
 * 
 * @param req - Authenticated request
 * @param res - Response with fully populated user data
 */
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Fetch the latest user data from the database
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        attempts: true,
        maxAttempts: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    throw error;
  }
};

