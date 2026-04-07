/**
 * @file types/index.ts
 * @description Global TypeScript type definitions for the frontend.
 * Mirrors the backend domain models and defines state/input structures 
 * for the React application.
 */

/**
 * Represents a registered user in the system.
 */
export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'USER' | 'ADMIN';
  status: 'ELIGIBLE' | 'DISQUALIFIED';
  attempts: number; // Number of attempts already taken
  maxAttempts: number; // Total allowed attempts
  createdAt: string;
}

/**
 * Metadata for an exam.
 */
export interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration: number; // In minutes
  maxAttempts: number;
  passMark: number;
  isActive: boolean;
  createdAt: string;
  questions?: Question[];
}

/**
 * A single question within an exam.
 */
export interface Question {
  id: string;
  examId: string;
  content: string; // The question text
  type: 'MCQ' | 'SUBJECTIVE';
  order: number;
  points: number;
  options?: Option[];
}

/**
 * A selectable option for a Multiple Choice Question (MCQ).
 */
export interface Option {
  id: string;
  questionId: string;
  content: string;
  order: number;
}

/**
 * Record of a single exam attempt session.
 */
export interface Attempt {
  id: string;
  userId: string;
  examId: string;
  startedAt: string;
  submittedAt: string | null;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
  timeSpent: number; // Seconds spent so far
  pasteCount: number; // Tracker for proctoring
  tabSwitchCount: number; // Tracker for proctoring
  exam?: {
    title: string;
    duration: number;
  };
  answers?: Answer[];
  score?: Score;
}

/**
 * A user's response to a specific question in an attempt.
 */
export interface Answer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOptionId: string | null; // For MCQ
  textAnswer: string | null; // For SUBJECTIVE
  wordCount: number;
  timeSpent: number;
  wpm: number; // Calculated typing speed for this answer
  pasteCount: number;
  question?: Question;
}

/**
 * The evaluation result for a completed attempt.
 */
export interface Score {
  id: string;
  userId: string;
  attemptId: string;
  accuracy: number;
  grammar: number;
  plagiarism: number;
  typingSpeed: number;
  promptQuality: number;
  finalScore: number;
  passed: boolean;
  createdAt: string;
  attempt?: Attempt;
}

/**
 * High-level performance metrics for the user dashboard.
 */
export interface DashboardStats {
  totalAttempts: number;
  remainingAttempts: number;
  maxAttempts: number;
  status: 'ELIGIBLE' | 'DISQUALIFIED';
  isEligible: boolean;
  canTakeExam: boolean; // Computed flag for UI
  lastAttempt?: {
    id: string;
    score: number;
    passed: boolean;
    createdAt: string;
  };
}

/**
 * Detailed report of a plagiarism flag (Admin).
 */
export interface PlagiarismReport {
  id: string;
  attemptId: string;
  similarityScore: number;
  matchedContent: string | null;
  source: string | null;
  flagged: boolean;
  createdAt: string;
}

/**
 * Audit log entry for administrative activity.
 */
export interface AdminAction {
  id: string;
  adminId: string;
  targetId: string;
  actionType: string;
  description: string | null;
  createdAt: string;
}

/**
 * Data required for user authentication.
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Data required for new user creation.
 */
export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

