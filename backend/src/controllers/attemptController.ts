/**
 * @file attemptController.ts
 * @description Controllers for managing exam attempts, including starting, 
 * saving answers, and final submission/evaluation.
 */

import { Response } from 'express';
import { AuthenticatedRequest, StartAttemptInput, SaveAnswerInput, SubmitAttemptInput } from '../types';
import { prisma } from '../utils/prisma';
import { startAttemptSchema, saveAnswerSchema, submitAttemptSchema } from '../utils/validation';
import { evaluateAttempt } from '../utils/evaluation';
import { AttemptStatus, UserStatus } from '@prisma/client';
import { sendDisqualifiedEmail, sendQualifiedEmail } from '../utils/email';
import { shuffleArray } from '../utils/shuffle';

/**
 * Initializes a new exam attempt for a user.
 * Validates eligibility, exam status, and attempt limits before creating the record.
 * 
 * @param req - Authenticated request containing examId
 * @param res - Response with the new attempt and exam questions
 */
export const startAttempt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Step 1: Validate input
    const validatedData = startAttemptSchema.parse(req.body) as StartAttemptInput;

    // Step 2: Check user eligibility status
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Block users who have been disqualified
    if (user.status === UserStatus.DISQUALIFIED) {
      res.status(403).json({ error: 'You have been disqualified from taking exams' });
      return;
    }

    // Step 3: Verify exam exists and is currently active
    const exam = await prisma.exam.findFirst({
      where: { id: validatedData.examId, isActive: true },
    });

    if (!exam) {
      res.status(404).json({ error: 'Exam not found or inactive' });
      return;
    }

    // Step 3: Check if user has already passed this exam
    // A user who has passed cannot retake the exam regardless of attempts remaining.
    const passedAttempt = await prisma.attempt.findFirst({
      where: {
        userId: user.id,
        examId: exam.id,
        status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.EXPIRED] }
      },
      include: { scores: true }
    });

    if (passedAttempt && passedAttempt.scores.some(s => s.passed)) {
      res.status(403).json({ error: 'You have already passed this exam' });
      return;
    }

    // Step 4: Enforce attempt limits (exam-specific max)
    const attemptsForExam = await prisma.attempt.count({
      where: {
        userId: user.id,
        examId: exam.id,
        status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.EXPIRED] }
      }
    });

    if (attemptsForExam >= exam.maxAttempts) {
      // User exhausted regular attempts. Check if they have been granted admin retake approval.
      const approval = await prisma.retakeApproval.findUnique({
        where: {
          userId_examId: { userId: user.id, examId: exam.id }
        },
      });

      if (!approval) {
        res.status(403).json({
          error: 'You have exhausted your attempts for this exam. Contact an admin to request a retake.'
        });
        return;
      }

      // Approval exists - delete it (one-time use) and allow this extra attempt
      await prisma.retakeApproval.delete({ where: { id: approval.id } });
    }

    // Step 5: Prevent concurrent attempts (only one "IN_PROGRESS" at a time)
    const inProgressAttempt = await prisma.attempt.findFirst({
      where: {
        userId: user.id,
        status: AttemptStatus.IN_PROGRESS,
      },
    });

    if (inProgressAttempt) {
      res.status(400).json({
        error: 'You already have an in-progress attempt',
        attemptId: inProgressAttempt.id,
      });
      return;
    }

    // Step 6: Create the attempt and include all questions for the frontend
    const attempt = await prisma.attempt.create({
      data: {
        userId: user.id,
        examId: exam.id,
        status: AttemptStatus.IN_PROGRESS,
      },
      include: {
        exam: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              include: {
                options: {
                  orderBy: { order: 'asc' },
                  select: {
                    id: true,
                    content: true,
                    order: true,
                    imageUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Step 7: Increment the user's total attempt count
    await prisma.user.update({
      where: { id: user.id },
      data: { attempts: { increment: 1 } },
    });

    res.status(201).json({
      message: 'Attempt started successfully',
      attempt: {
        id: attempt.id,
        startedAt: attempt.startedAt,
        status: attempt.status,
        exam: {
          id: attempt.exam.id,
          title: attempt.exam.title,
          duration: attempt.exam.duration,
          questions: shuffleArray(attempt.exam.questions).map((q) => ({
            id: q.id,
            content: q.content,
            type: q.type,
            points: q.points,
            image: q.image,
            // options are also shuffled but id stays the same
            options: shuffleArray(q.options).map((o) => ({
              id: o.id,
              content: o.content,
              imageUrl: o.imageUrl,
            }))
          })),
        },
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Saves a single answer for an in-progress attempt.
 * Uses upsert to either create a new answer or update an existing one.
 * 
 * @param req - Request containing attemptId, questionId, and response data
 * @param res - Success status and saved answer
 */
export const saveAnswer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const validatedData = saveAnswerSchema.parse(req.body) as SaveAnswerInput;

    // Verify the attempt belongs to this user and is still active
    const attempt = await prisma.attempt.findFirst({
      where: {
        id: validatedData.attemptId,
        userId: req.user.id,
        status: AttemptStatus.IN_PROGRESS,
      },
    });

    if (!attempt) {
      // If the attempt is already submitted, we don't throw an error, we just exit quietly
      // because we don't want to break the frontend if a late 'save' comes in.
      const submittedAttempt = await prisma.attempt.findFirst({
        where: { id: validatedData.attemptId, userId: req.user.id, status: AttemptStatus.SUBMITTED }
      });

      if (submittedAttempt) {
        res.json({ message: 'Answer ignored: session already submitted' });
        return;
      }

      res.status(404).json({ error: 'Attempt not found or not in progress' });
      return;
    }

    // Upsert logic ensures we don't have duplicate answers for the same question/attempt
    const answer = await prisma.answer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: validatedData.attemptId,
          questionId: validatedData.questionId,
        },
      },
      update: {
        selectedOptionId: validatedData.selectedOptionId,
        textAnswer: validatedData.textAnswer,
        wordCount: validatedData.wordCount,
        timeSpent: validatedData.timeSpent,
        wpm: validatedData.wpm,
        pasteCount: {
          increment: validatedData.pasteCount || 0,
        },
      },
      create: {
        attemptId: validatedData.attemptId,
        questionId: validatedData.questionId,
        selectedOptionId: validatedData.selectedOptionId,
        textAnswer: validatedData.textAnswer,
        wordCount: validatedData.wordCount || 0,
        timeSpent: validatedData.timeSpent || 0,
        wpm: validatedData.wpm || 0,
        pasteCount: validatedData.pasteCount || 0,
      },
    });

    res.json({
      message: 'Answer saved successfully',
      answer,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Submits an attempt for final evaluation.
 * Calculates time spent, marks status as SUBMITTED, and runs the evaluation engine.
 * 
 * @param req - Request containing attemptId
 * @param res - Detailed results, including final score and pass/fail status
 */
export const submitAttempt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const validatedData = submitAttemptSchema.parse(req.body) as SubmitAttemptInput;

    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Case: Attempt was already submitted (Idempotency check)
    // If the user clicks 'submit' twice, the first one marks it as SUBMITTED.
    // The second one should just return the existing score instead of failing with 404.
    const attempt = await prisma.attempt.findFirst({
      where: {
        id: validatedData.attemptId,
        userId: req.user.id,
      },
      include: {
        exam: true,
        scores: true,
      },
    });

    if (!attempt) {
      res.status(404).json({ error: 'Attempt not found' });
      return;
    }

    if (attempt.status === AttemptStatus.SUBMITTED || attempt.status === AttemptStatus.EXPIRED) {
      // If a score already exists, return it
      if (attempt.scores.length > 0) {
        const score = attempt.scores[0];
        res.json({
          message: 'Attempt was already submitted',
          attempt: {
            id: attempt.id,
            status: attempt.status,
            submittedAt: attempt.submittedAt,
            timeSpent: attempt.timeSpent,
          },
          score: {
            finalScore: score.finalScore,
            passed: score.passed,
            breakdown: score.details as any,
          },
        });
        return;
      }

      // If status is submitted but score doesn't exist, something went wrong previously
      // and we should proceed to re-evaluate it safely.
    }

    // Step 1: Finalize timing
    const timeSpent = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);

    // Step 2 & 3 & 4: Run everything in a transaction for atomicity
    // We run evaluation first, then commit the status change and the score record together.
    const evaluation = await evaluateAttempt(validatedData.attemptId);

    const result = await prisma.$transaction(async (tx) => {
      if (!req.user) throw new Error('User context lost during transaction');

      const updatedAttempt = await tx.attempt.update({
        where: { id: validatedData.attemptId },
        data: {
          status: AttemptStatus.SUBMITTED,
          submittedAt: new Date(),
          timeSpent,
        },
      });

      const score = await tx.score.create({
        data: {
          userId: req.user.id,
          attemptId: validatedData.attemptId,
          accuracy: evaluation.accuracy,
          grammar: evaluation.grammar,
          plagiarism: evaluation.plagiarism,
          typingSpeed: evaluation.typingSpeed,
          promptQuality: evaluation.promptQuality,
          finalScore: evaluation.finalScore,
          passed: evaluation.passed,
          details: {
            accuracy: evaluation.accuracy,
            grammar: evaluation.grammar,
            plagiarism: evaluation.plagiarism,
            typingSpeed: evaluation.typingSpeed,
            promptQuality: evaluation.promptQuality,
          },
        },
      });

      // Post-submission checks
      const allScores = await tx.score.findMany({
        where: { userId: req.user!.id },
        select: { passed: true },
      });

      const hasAnyPass = allScores.some((s) => s.passed);
      const user = await tx.user.findUnique({ where: { id: req.user!.id } });
      if (!user) throw new Error('User not found');
      
      if (hasAnyPass) {
        // Rule: one pass = qualified
        await tx.user.update({
          where: { id: req.user!.id },
          data: { status: UserStatus.QUALIFIED },
        });
        if (user?.email && user?.fullName) sendQualifiedEmail(user.email, user.fullName).catch(console.log);
      } else {
        // If they failed, we don't globally disqualify them immediately.
        // They are just disqualified from this specific exam if they hit the max attempts for it,
        // which is handled by startAttempt blocking them.
        // We only globally disqualify if they've exhausted attempts on ALL active exams, 
        // but for now, remaining ELIGIBLE lets them try other active exams.
        const attemptsForExam = await tx.attempt.count({
          where: { userId: user.id, examId: attempt.examId, status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.EXPIRED] } }
        });
        
        if (attemptsForExam >= attempt.exam.maxAttempts) {
          console.log(`User ${user.id} exhausted attempts for exam ${attempt.examId}`);
          
          // Optionally check if there are any other exams they can take, 
          // but relying on the per-exam check is safer.
        }
      }

      // Return updated records so the caller can respond
      return { updatedAttempt, score };
    });

    res.json({
      message: 'Attempt submitted successfully',
      attempt: {
        id: result.updatedAttempt.id,
        status: result.updatedAttempt.status,
        submittedAt: result.updatedAttempt.submittedAt,
        timeSpent: result.updatedAttempt.timeSpent,
      },
      score: {
        finalScore: result.score.finalScore,
        passed: result.score.passed,
        breakdown: result.score.details as any,
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieves all previous exam submissions for the current user.
 * 
 * @param req - Authenticated request
 * @param res - List of past attempts with scores
 */
export const getMyAttempts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Fetch submitted or expired attempts
    const attempts = await prisma.attempt.findMany({
      where: {
        userId: req.user.id,
        status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.EXPIRED] },
      },
      include: {
        exam: {
          select: {
            title: true,
            duration: true,
            passMark: true,
          },
        },
        scores: true, // Fixed from 'score' to match Prisma schema relation
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ attempts });
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieves detailed breakdown for a specific attempt, including answers and scoring details.
 * 
 * @param req - Request with attempt ID in params
 * @param res - Full attempt details with answers and questions
 */
export const getAttemptDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    const attempt = await prisma.attempt.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
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
        scores: true, // Fixed from 'score' to match Prisma schema relation
      },
    });

    if (!attempt) {
      res.status(404).json({ error: 'Attempt not found' });
      return;
    }

    res.json({ attempt });
  } catch (error) {
    throw error;
  }
};

/**
 * Internal tracking: Increments the count of paste events during an exam.
 * Used as a signal for potential plagiarism analysis.
 */
export const trackPaste = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { attemptId } = req.body;

    await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        pasteCount: { increment: 1 },
      },
    });

    res.json({ message: 'Paste event tracked' });
  } catch (error) {
    throw error;
  }
};

/**
 * Internal tracking: Increments the count of tab switches during an exam.
 * Helps identify if a user is navigating away from the test window.
 */
export const trackTabSwitch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { attemptId } = req.body;

    await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        tabSwitchCount: { increment: 1 },
      },
    });

    res.json({ message: 'Tab switch tracked' });
  } catch (error) {
    throw error;
  }
};


export const approveRetake = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { userId, examId } = req.body;

    await prisma.retakeApproval.upsert({
      where: { userId_examId: { userId, examId } },
      create: { userId, examId, approvedBy: req.user.id },
      update: { approvedBy: req.user.id },
    });

    await prisma.adminAction.create({
      data: {
        adminId: req.user.id,
        targetId: userId,
        actionType: 'APPROVE_RETAKE',
        description: `Approved retake for exam ${examId}`,
      },
    });

    res.json({ message: 'Retake approved' });
  } catch (error) {
    throw error;
  }
};