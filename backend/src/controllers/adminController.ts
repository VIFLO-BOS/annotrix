/**
 * @file adminController.ts
 * @description Controllers for administrative actions such as user management,
 * resetting attempts, and viewing analytics.
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../utils/prisma';
import { resetAttemptsSchema, updateUserStatusSchema } from '../utils/validation';
import { AttemptStatus, UserStatus } from '@prisma/client';
import { exportUsersToExcel } from '../utils/excel';

/**
 * Retrieves a list of all users and their basic statistics.
 * 
 * @param req - Authenticated request (admin)
 * @param res - Response containing users array
 */
export const getAllUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Query all users from the database, selecting specific fields to avoid leaking secrets
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        attempts: true,
        maxAttempts: true,
        ninVerified: true,
        emailVerified: true,
        PhoneVerified: true,
        createdAt: true,
        _count: {
          select: {
            // Count only valid attempts (submitted or expired)
            attempts_data: {
              where: {
                status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.EXPIRED] },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' }, // Show newest users first
    });

    res.json({ users });
  } catch (error) {
    // Pass errors to the global error handler
    throw error;
  }
};

/**
 * Retrieves detailed information about a specific user, including their testing history.
 * 
 * @param req - Request containing user ID in params
 * @param res - Response containing detailed user data
 */
export const getUserDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Fetch user profile and include their submitted attempts with exam details and scores
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        attempts: true,
        maxAttempts: true,
        ninVerified: true,
        emailVerified: true,
        PhoneVerified: true,
        createdAt: true,
        attempts_data: {
          where: {
            status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.EXPIRED] },
          },
          orderBy: { createdAt: 'desc' },
          include: {
            exam: {
              select: {
                title: true,
              },
            },
            scores: true,
          },
        },
      },
    });

    // Handle case where user does not exist
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    throw error;
  }
};

/**
 * Resets a user's attempt count back to zero and reactivates their account.
 * Primarily used when a user has exhausted their attempts or encountered an error.
 * 
 * @param req - Request containing user ID in body
 * @param res - Success message and updated user info
 */
export const resetAttempts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Ensure the admin themselves is authenticated
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Step 1: Validate the request body using Zod schema
    const validatedData = resetAttemptsSchema.parse(req.body);

    // Step 2: Update the user in the database
    const user = await prisma.user.update({
      where: { id: validatedData.userId },
      data: {
        attempts: 0,
        status: UserStatus.ELIGIBLE, // Reactivate the user
      },
    });

    // Step 3: Log the administrative action for accountability
    await prisma.adminAction.create({
      data: {
        adminId: req.user.id,
        targetId: validatedData.userId,
        actionType: 'RESET_ATTEMPTS',
        description: `Reset attempts for user ${user.email}`,
      },
    });

    res.json({
      message: 'User attempts reset successfully',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        attempts: user.attempts,
        status: user.status,
        ninVerified: user.ninVerified,
        emailVerified: user.emailVerified,
        PhoneVerified: user.PhoneVerified,
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Updates a user's eligibility status (e.g., DISQUALIFIED or ELIGIBLE).
 * Can be used to manually block users for policy violations.
 * 
 * @param req - Request containing user ID and new status
 * @param res - Success message and updated status
 */
export const updateUserStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Step 1: Validate input data
    const validatedData = updateUserStatusSchema.parse(req.body);

    // Step 2: Update status in database
    const user = await prisma.user.update({
      where: { id: validatedData.userId },
      data: {
        status: validatedData.status as UserStatus,
      },
    });

    // Step 3: Log action (Reactivate vs Disqualify)
    await prisma.adminAction.create({
      data: {
        adminId: req.user.id,
        targetId: validatedData.userId,
        actionType: validatedData.status === 'ELIGIBLE' ? 'REACTIVATE_USER' : 'DISQUALIFY_USER',
        description: `Changed user status to ${validatedData.status}`,
      },
    });

    res.json({
      message: 'User status updated successfully',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        status: user.status,
        ninVerified: user.ninVerified,
        emailVerified: user.emailVerified,
        PhoneVerified: user.PhoneVerified,
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieves all reported plagiarism incidents with user and exam details.
 * 
 * @param req - Admin request
 * @param res - List of reports
 */
export const getPlagiarismReports = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Fetch reports including user name/email and exam title for context
    const reports = await prisma.plagiarismReport.findMany({
      include: {
        attempt: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
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

    res.json({ reports });
  } catch (error) {
    throw error;
  }
};

/**
 * Generates high-level analytics for the admin dashboard.
 * Includes total counts, pass/fail rates, and average scoring metrics.
 * 
 * @param req - Admin request
 * @param res - Comprehensive analytics object
 */
export const getAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Execute multiple database counts and aggregates to get a system overview

    // Total numbers
    const totalUsers = await prisma.user.count({ where: { role: 'USER' } });
    const totalExams = await prisma.exam.count();
    const totalAttempts = await prisma.attempt.count({
      where: { status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.EXPIRED] } },
    });

    // Success metrics
    const passCount = await prisma.score.count({ where: { passed: true } });
    const failCount = await prisma.score.count({ where: { passed: false } });
    const disqualifiedCount = await prisma.user.count({ where: { status: 'DISQUALIFIED' } });

    // Performance averages across all tests
    const avgScores = await prisma.score.aggregate({
      _avg: {
        finalScore: true,
        accuracy: true,
        grammar: true,
        plagiarism: true,
        typingSpeed: true,
      },
    });

    // Fetch the 10 most recent submissions to show activity
    const recentAttempts = await prisma.attempt.findMany({
      where: { status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.EXPIRED] } },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, email: true } },
        exam: { select: { title: true } },
        scores: true,
      },
    });

    // Count flagged plagiarism cases requiring review
    const flaggedPlagiarism = await prisma.plagiarismReport.count({
      where: { flagged: true },
    });

    // Respond with a consolidated analytics object
    res.json({
      analytics: {
        totalUsers,
        totalExams,
        totalAttempts,
        passCount,
        failCount,
        disqualifiedCount,
        passRate: totalAttempts > 0 ? (passCount / totalAttempts) * 100 : 0,
        averageScores: {
          finalScore: avgScores._avg.finalScore || 0,
          accuracy: avgScores._avg.accuracy || 0,
          grammar: avgScores._avg.grammar || 0,
          plagiarism: avgScores._avg.plagiarism || 0,
          typingSpeed: avgScores._avg.typingSpeed || 0,
        },
        recentAttempts,
        flaggedPlagiarism,
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieves the audit log of administrative actions.
 * Provides transparency on which admin performed which action on which user.
 * 
 * @param req - Admin request
 * @param res - Log of admin actions
 */
export const getAdminActions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Fetch up to 100 recent actions, including names and emails for admin and target
    const actions = await prisma.adminAction.findMany({
      include: {
        admin: { select: { fullName: true, email: true } },
        target: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to recent activity
    });

    res.json({ actions });
  } catch (error) {
    throw error;
  }
};

export const getQualifiedUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { status: UserStatus.QUALIFIED },
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
    res.json({ users });
  } catch (error) {
    throw error;
  }
};

export const getDisqualifiedUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { status: UserStatus.DISQUALIFIED },
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
    res.json({ users });
  } catch (error) {
    throw error;
  }
};

export const adminVerifyUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { userId } = req.body;
    await prisma.user.update({
      where: { id: userId },
      data: { ninVerified: true, emailVerified: true, PhoneVerified: true },
    });

    await prisma.adminAction.create({
      data: {
        adminId: req.user.id,
        targetId: userId,
        actionType: 'MANUAL_VERIFY',
        description: 'Manually verified user (NIN, email, phone)',
      },
    });

    res.json({ message: 'User manually verified by admin' });
  } catch (error) {
    throw error;
  }
};

export const exportQualifiedUsers = async (req: AuthenticatedRequest, res: Response) => {
  const users = await prisma.user.findMany({
    where: { status: 'QUALIFIED', role: 'USER' },
    select: { fullName: true, email: true, phone: true, createdAt:true}
  })
  await exportUsersToExcel(res, users, 'Qualified Users', 'qualified-users');
}

export const exportDisQualifiedUsers = async (req: AuthenticatedRequest, res: Response) => {
  const users = await prisma.user.findMany({
    where: { status: 'DISQUALIFIED', role: 'USER' },
    select: { fullName: true, email: true, phone: true, createdAt:true}
  })
  await exportUsersToExcel(res, users, 'Disqualified Users', 'disqualified-users');
}

export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    throw error;
  }
};