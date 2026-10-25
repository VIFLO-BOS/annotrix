/**
 * @file auth.ts
 * @description Authentication utilities for JWT generation/verification 
 * and secure password hashing using Node's crypto module.
 */

import jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

// Configuration for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = '7d';

/**
 * Structure of the decoded JWT payload used across the application.
 */
export interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Generates a signed JWT for a user session.
 * 
 * @param payload - User identification and role
 * @returns A signed JWT string
 */
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Validates a JWT string and returns its decoded payload.
 * 
 * @throws - If the token is invalid or expired
 */
export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};

/**
 * Creates a secure hash of a password using PBKDF2.
 * Stores both the salt and the hash together for later verification.
 * 
 * @param password - Plaintext password
 * @returns A string in the format 'salt:hash'
 */
export const hashPassword = (password: string): string => {
  // Generate a random 16-byte salt
  const salt = crypto.randomBytes(16).toString('hex');

  // Hash the password using PBKDF2 (SHA-512, 1000 iterations)
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

  return `${salt}:${hash}`;
};

/**
 * Compares a plaintext password with a stored hash.
 * 
 * @param password - The password attempt
 * @param hashedPassword - The stored string in 'salt:hash' format
 */
export const verifyPassword = (password: string, hashedPassword: string): boolean => {
  // Split the stored value back into salt and original hash
  const [salt, hash] = hashedPassword.split(':');

  // Re-hash the attempt using the original salt and parameters
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

  // Return true if the resulting hash matches the stored one
  return hash === verifyHash;
};

/**
 * Hash a NIN using SHA-256. One-way - cannot be reversed.
 * We hash (not encrypt) because we only need equality checks.
 */
export const hashNIN = (nin: string): string => {
  return crypto.createHash('sha256').update(nin.trim()).digest('hex');
}