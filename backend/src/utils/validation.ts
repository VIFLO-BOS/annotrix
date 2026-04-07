/**
 * @file validation.ts
 * @description Defines Zod schemas for validating incoming request data 
 * throughout the application. Ensures type safety and data integrity at the API layer.
 */

import { z } from 'zod';
import { QuestionType } from '@prisma/client';

/**
 * Validation for user registration requests.
 */
export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * Validation for login credentials.
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Complex schema for creating an exam, including nested questions and options.
 */
export const createExamSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  maxAttempts: z.number().min(1).optional(),
  passMark: z.number().min(0).max(100).optional(),
  questions: z.array(z.object({
    content: z.string().min(1, 'Question content is required'),
    type: z.nativeEnum(QuestionType),
    order: z.number().min(0),
    points: z.number().min(0).optional(),
    options: z.array(z.object({
      content: z.string().min(1, 'Option content is required'),
      isCorrect: z.boolean().optional(),
      order: z.number().min(0),
    })).optional(),
  })).min(1, 'At least one question is required'),
});

/**
 * Simple validation for starting a new attempt.
 */
export const startAttemptSchema = z.object({
  examId: z.string().uuid('Invalid exam ID'),
});

/**
 * Validation for saving an individual answer during an active attempt.
 */
export const saveAnswerSchema = z.object({
  attemptId: z.string().uuid('Invalid attempt ID'),
  questionId: z.string().uuid('Invalid question ID'),
  selectedOptionId: z.string().uuid('Invalid option ID').optional().nullable(),
  textAnswer: z.string().optional().nullable(),
  wordCount: z.number().min(0).optional(),
  timeSpent: z.number().min(0).optional(), // Time spent specifically on this question
  wpm: z.number().min(0).optional(),
  pasteCount: z.number().min(0).optional(),
});

/**
 * Validation for final attempt submission.
 */
export const submitAttemptSchema = z.object({
  attemptId: z.string().uuid('Invalid attempt ID'),
});

/**
 * Admin-only: Validation for resetting user attempts.
 */
export const resetAttemptsSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

/**
 * Admin-only: Validation for changing a user's eligibility status.
 */
export const updateUserStatusSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  status: z.enum(['ELIGIBLE', 'DISQUALIFIED']),
});

