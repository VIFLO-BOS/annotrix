/**
 * @file examController.ts
 * @description Controllers for managing exams, including CRUD operations 
 * for admins and retrieval for users.
 */

import { Response, NextFunction} from 'express';
import { AuthenticatedRequest, CreateExamInput } from '../types';
import { prisma } from '../utils/prisma';
import { createExamSchema } from '../utils/validation';

/**
 * Retrieves a list of all active exams available for users to take.
 * 
 * @param req - Authenticated request
 * @param res - Array of active exams (sanitized for standard users)
 */
export const getExams = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const exams = await prisma.exam.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        maxAttempts: true,
        passMark: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ exams });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves a single exam with its questions and options.
 * 
 * @param req - Request with exam ID in params
 * @param res - Detailed exam object
 */
export const getExam = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            content: true,
            type: true,
            order: true,
            points: true,
            image: true,
            options: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                content: true,
                order: true,
                imageUrl: true,
                isCorrect: true,
              },
            },
          },
        },
      },
    });

    if (!exam) {
      res.status(404).json({ error: 'Exam not found' });
      return;
    }

    res.json({ exam });
  } catch (error) {
    next(error);
  }
};


/**
 * Creates a new exam with questions and options (Admin only).
 * Performs a recursive create operation in Prisma.
 * 
 * @param req - Request with full exam structure in body
 * @param res - Created exam object
 * @param next - Error forwarding
 */
export const createExam = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Step 1: Validate complex nested exam structure
    const validatedData = createExamSchema.parse(req.body) as CreateExamInput;

    // Step 2: Use Prisma's nested create to build the entire exam graph in one transaction
    const exam = await prisma.exam.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        duration: validatedData.duration,
        maxAttempts: validatedData.maxAttempts || 3,
        passMark: validatedData.passMark || 80,
        questions: {
          create: validatedData.questions.map(q => ({
            content: q.content,
            type: q.type,
            order: q.order,
            points: q.points || 10,
            image: q.imageUrl,
            options: q.options ? {
              create: q.options.map(o => ({
                content: o.content,
                isCorrect: o.isCorrect || false,
                order: o.order,
                imageUrl: o.imageUrl,
              })),
            } : undefined,
          })),
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Exam created successfully',
      exam,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates basic exam details (Admin only).
 * 
 * @param req - Request with exam ID in params and update fields in body
 * @param res - Updated exam object
 */
export const updateExam = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, duration, isActive, maxAttempts, passMark } = req.body;

    // Direct update of the Exam model
    const exam = await prisma.exam.update({
      where: { id },
      data: {
        title,
        description,
        duration,
        isActive,
        maxAttempts,
        passMark,
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    res.json({
      message: 'Exam updated successfully',
      exam,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Deletes an exam from the system (Admin only).
 * Prisma handles cascading deletion of questions and options.
 */
export const deleteExam = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Perform deletion
    await prisma.exam.delete({
      where: { id },
    });

    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves all exams with high-level statistics for administration (Admin only).
 * Includes counts of questions and total attempts taken by users.
 */
export const getAllExamsAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const exams = await prisma.exam.findMany({
      include: {
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ exams });
  } catch (error) {
    next(error);
  }
};


