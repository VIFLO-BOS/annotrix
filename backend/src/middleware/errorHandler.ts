/**
 * @file errorHandler.ts
 * @description Global error handling middleware for the Express application.
 * Catches errors thrown in routes and formats them for the client.
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { ZodError } from 'zod';

/**
 * Global error handler middleware.
 * 
 * @param err - The raw error object
 * @param req - The request object
 * @param res - The response object
 * @param next - The next middleware function (unused but required by Express signature)
 */
export const errorHandler = (
  err: Error,
  req: AuthenticatedRequest,
  res: Response,
  next: any
): void => {
  // Always log the error to the console for debugging
  console.error('Error:', err);

  // Handle Validation Errors (from Zod)
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map(e => ({
      field: e.path.join('.'), // Flatten the error path to a string (e.g. "user.email")
      message: e.message,
    }));
    
    res.status(400).json({
      error: 'Validation failed',
      details: formattedErrors,
    });
    return;
  }

  // Handle Unauthorized Errors (specifically named)
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Handle all other unexpected errors (Internal Server Error)
  res.status(500).json({
    error: 'Internal server error',
    // Only show detailed error messages in development mode to avoid leaking system info
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

