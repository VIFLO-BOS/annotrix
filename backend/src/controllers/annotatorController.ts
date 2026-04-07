/**
 * @file dashboardController.ts
 * @description Controllers for the user dashboard, providing statistics, 
 * historical scores, and detailed result breakdown.
 */

import { Response } from 'express';
import { AuthenticatedRequest, DashboardStats } from '../types';
import { prisma } from '../utils/prisma';
import { AttemptStatus } from '@prisma/client';

/**
 * Retrieves high-level statistics for the user's dashboard.
 * Includes total attempts, eligibility status, and details of the most recent attempt.
 * 
 * @param req - Authenticated request
 * @param res - Dashboard stats object
 */
export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Fetch user data along with summarized attempt counts and the very latest result
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        attempts_data: {
          where: {
            status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.EXPIRED] },
          },
          orderBy: { createdAt: 'desc' },
          take: 1, // Only need the most recent one for the summary
          include: {
            scores: true, // Fixed from 'score' to match Prisma schema
          },
        },
        _count: {
          select: {
            attempts_data: {
              where: {
                status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.EXPIRED] },
              },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Step 1: Check for any currently active attempts
    const inProgressAttempt = await prisma.attempt.findFirst({
      where: {
        userId: user.id,
        status: AttemptStatus.IN_PROGRESS,
      },
    });

    // Step 2: Check if there are any exams available to take
    const activeExamsCount = await prisma.exam.count({
      where: { isActive: true },
    });

    // Step 3: Calculate eligibility and remaining attempts
    const totalAttempts = user._count.attempts_data;
    const remainingAttempts = Math.max(0, user.maxAttempts - totalAttempts);
    const isEligible = user.status === 'ELIGIBLE';
    
    // logic: user can take exam if they are eligible, have attempts left, exams exist, and no current attempt is active
    const canTakeExam = isEligible && remainingAttempts > 0 && activeExamsCount > 0 && !inProgressAttempt;

    // Step 4: Format the response object
    const stats: DashboardStats = {
      totalAttempts,
      remainingAttempts,
      maxAttempts: user.maxAttempts,
      status: user.status,
      isEligible,
      canTakeExam,
      lastAttempt: user.attempts_data[0] ? {
        id: user.attempts_data[0].id,
        // Since scores is an array, we take the first item
        score: user.attempts_data[0].scores[0]?.finalScore || 0,
        passed: user.attempts_data[0].scores[0]?.passed || false,
        createdAt: user.attempts_data[0].createdAt,
      } : undefined,
    };

    res.json({ stats });
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieves a list of all completed scores for the authenticated user.
 * 
 * @param req - Authenticated request
 * @param res - Array of scores with associated exam titles
 */
export const getMyScores = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Fetch scores ordered by newest first
    const scores = await prisma.score.findMany({
      where: { userId: req.user.id },
      include: {
        attempt: {
          include: {
            exam: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ scores });
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieves the full breakdown of a specific score.
 * Useful for showing a user exactly how they were evaluated (grammar, accuracy, etc.).
 * 
 * @param req - Request containing score ID in params
 * @param res - Detailed score object including attempt answers and question contents
 */
export const getScoreDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    // Fetch specific score and join with attempt -> exam -> questions -> answers
    const score = await prisma.score.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        attempt: {
          include: {
            exam: {
              select: {
                title: true,
                duration: true,
              },
            },
            answers: {
              include: {
                question: {
                  select: {
                    content: true,
                    type: true,
                    points: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!score) {
      res.status(404).json({ error: 'Score not found' });
      return;
    }

    res.json({ score });
  } catch (error) {
    throw error;
  }
};

