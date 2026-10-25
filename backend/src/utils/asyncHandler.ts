/**
 * @file asyncHandler.ts
 * @description Wraps async Express route handlers so that rejected promises
 * are forwarded to Express's error-handling middleware via next(),
 * preventing unhandled promise rejections from crashing the server.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async route handler to catch errors and forward them to Express.
 * Without this, async errors become unhandled promise rejections that crash the process.
 *
 * @param fn - An async Express request handler
 * @returns A wrapped handler that catches errors and calls next(error)
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
