/**
 * @file auth.ts
 * @description Authentication and Authorization middleware for securing routes.
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { verifyToken } from '../utils/auth';

/**
 * Middleware to authenticate requests using a JWT Bearer token.
 * Validates the token and attaches the decoded user information to the request object.
 * 
 * @param req - The authenticated request object
 * @param res - Express response object
 * @param next - Next middleware function
 */
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    // Check if the authorization header exists and follows the 'Bearer <token>' format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Access denied. No token provided.' });
      return;
    }

    // Extract the token (everything after 'Bearer ')
    const token = authHeader.substring(7);
    
    // Verify the JWT token and decode its payload
    const decoded = verifyToken(token);

    // Attach user data to the request for use in subsequent middleware/controllers
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role as any,
    };

    next(); // Proceed to the next middleware/controller
  } catch (error) {
    // If verification fails, the token is either invalid, expired, or malformed
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Authorization middleware to restrict access to administrators only.
 * Requires the 'authenticate' middleware to have run beforehand.
 */
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    return;
  }
  next(); // User is an admin, proceed
};

/**
 * Authorization middleware to restrict access to standard users only.
 * Prevents admins or unauthenticated users from accessing user-specific actions if needed.
 */
export const requireUser = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'USER') {
    res.status(403).json({ error: 'Access denied. User privileges required.' });
    return;
  }
  next(); // User is a standard user, proceed
};

