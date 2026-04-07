/**
 * @file examStore.ts
 * @description Global state management for an active exam session.
 * Tracks the current exam details, running attempt, student answers, timer, 
 * and proctoring/integrity events (tab switches, pastes).
 */

import { create } from 'zustand';
import { Exam, Attempt, Question, Answer } from '@/types';
import { persist } from 'zustand/middleware';

/**
 * Interface representing the state of an active exam.
 */
interface ExamState {
  // Metadata about the exam currently being taken
  currentExam: Exam | null;
  // The specific attempt record for the user
  currentAttempt: Attempt | null;
  // Map of question IDs to user answers (local buffer)
  answers: Record<string, Answer>;
  // Seconds left until the exam expires
  timeRemaining: number;
  // Whether the test UI is currently interactive
  isExamActive: boolean;
  // Cumulative number of paste events detected (proctoring)
  pasteCount: number;
  // Cumulative number of browser tab switches detected (proctoring)
  tabSwitchCount: number;
  // Flag indicating if the store has hydrated from localStorage
  hasHydrated: boolean;

  // State Updaters
  setCurrentExam: (exam: Exam | null) => void;
  setCurrentAttempt: (attempt: Attempt | null) => void;
  setAnswer: (questionId: string, answer: Partial<Answer>) => void;
  setTimeRemaining: (time: number) => void;
  setExamActive: (active: boolean) => void;
  incrementPasteCount: () => void;
  incrementTabSwitchCount: () => void;
  setHasHydrated: (value: boolean) => void;
  // Clears the entire session state (e.g., after submission or on exit)
  resetExam: () => void;
}

/**
 * Exam Store Hook
 * Provides high-performance state management for the real-time exam environment.
 */
export const useExamStore = create<ExamState>()(
  persist(
    (set) => ({
      currentExam: null,
      currentAttempt: null,
      answers: {},
      timeRemaining: 0,
      isExamActive: false,
      pasteCount: 0,
      tabSwitchCount: 0,
      hasHydrated: false,

      setCurrentExam: (exam) => set({ currentExam: exam }),
      setCurrentAttempt: (attempt) => set({ currentAttempt: attempt }),

      /**
       * Merges a partial answer into the local answers buffer.
       */
      setAnswer: (questionId, answer) =>
        set((state) => ({
          answers: {
            ...state.answers,
            [questionId]: { ...state.answers[questionId], ...answer, questionId } as Answer,
          },
        })),

      setTimeRemaining: (time) => set({ timeRemaining: time }),
      setExamActive: (active) => set({ isExamActive: active }),

      // Proctoring Incrementors
      incrementPasteCount: () => set((state) => ({ pasteCount: state.pasteCount + 1 })),
      incrementTabSwitchCount: () => set((state) => ({ tabSwitchCount: state.tabSwitchCount + 1 })),
      setHasHydrated: (value) => set({ hasHydrated: value }),

      /**
       * Resets all session data to initial values.
       */
      resetExam: () =>
        set({
          currentExam: null,
          currentAttempt: null,
          answers: {},
          timeRemaining: 0,
          isExamActive: false,
          pasteCount: 0,
          tabSwitchCount: 0,
          hasHydrated: true, // Keep it true once hydrated
        }),
    }),
    {
      name: 'active-exam-storage',
      partialize: (state) => ({
        currentExam: state.currentExam,
        currentAttempt: state.currentAttempt,
        answers: state.answers,
        timeRemaining: state.timeRemaining,
        isExamActive: state.isExamActive,
        pasteCount: state.pasteCount,
        tabSwitchCount: state.tabSwitchCount,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  ));

