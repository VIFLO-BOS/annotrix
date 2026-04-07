/**
 * @file evaluation.ts
 * @description Core evaluation engine for scoring exam attempts.
 * Includes logic for accuracy, typing speed (WPM), grammar analysis, 
 * plagiarism detection, and prompt quality assessment.
 */

import { QuestionType } from '@prisma/client';
import { EvaluationResult, GrammarCheckResult, PlagiarismCheckResult } from '../types';
import { prisma } from './prisma';

/**
 * Calculates an accuracy score based on correct answers.
 * MCQ: 100% credit for the correct choice.
 * SUBJECTIVE: Currently gives 50% "attempt credit" if any text is provided.
 * 
 * @param attemptId - The unique ID of the attempt to evaluate
 * @returns A numerical score from 0 to 100
 */
export const calculateAccuracy = async (attemptId: string): Promise<number> => {
  // Fetch all answers for this attempt including the correct options for comparison
  const answers = await prisma.answer.findMany({
    where: { attemptId },
    include: {
      question: {
        include: {
          options: true,
        },
      },
    },
  });

  let totalPoints = 0;
  let earnedPoints = 0;

  for (const answer of answers) {
    totalPoints += answer.question.points;

    // Logic for Multiple Choice Questions
    if (answer.question.type === QuestionType.MCQ) {
      const correctOption = answer.question.options.find((o: any) => o.isCorrect);
      if (correctOption && answer.selectedOptionId === correctOption.id) {
        earnedPoints += answer.question.points;
      }
    } 
    // Logic for Subjective/Text Questions
    else {
      // For subjective questions, we give base 50% credit for any non-empty response.
      // This is often a placeholder for human review or more advanced AI analysis.
      if (answer.textAnswer && answer.textAnswer.trim().length > 0) {
        earnedPoints += answer.question.points * 0.5;
      }
    }
  }

  return totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
};

/**
 * Calculates a typing speed score based on Words Per Minute (WPM).
 * Maps raw WPM to a percentage based on professional standards.
 * 
 * @param attemptId - The unique ID of the attempt
 * @returns A percentage score representing typing proficiency
 */
export const calculateTypingSpeed = async (attemptId: string): Promise<number> => {
  const answers = await prisma.answer.findMany({
    where: { attemptId },
  });

  let totalWPM = 0;
  let subjectiveCount = 0;

  // Aggregate WPM scores from all text-based answers
  for (const answer of answers) {
    if (answer.wpm > 0) {
      totalWPM += answer.wpm;
      subjectiveCount++;
    }
  }

  const avgWPM = subjectiveCount > 0 ? totalWPM / subjectiveCount : 0;
  
  /**
   * WPM Scoring Curves:
   * 60+ WPM   -> 100% (Expert/Fast)
   * 40-60 WPM -> 75% - 100% (Professional/Average)
   * 20-40 WPM -> 50% - 75% (Basic)
   * 10-20 WPM -> 25% - 50% (Slow)
   * < 10 WPM  -> < 25% (Needs Improvement)
   */
  if (avgWPM >= 60) return 100;
  if (avgWPM >= 40) return 75 + ((avgWPM - 40) / 20) * 25;
  if (avgWPM >= 20) return 50 + ((avgWPM - 20) / 20) * 25;
  if (avgWPM >= 10) return 25 + ((avgWPM - 10) / 10) * 25;
  return Math.max(0, avgWPM * 2.5);
};

/**
 * Performs a basic heuristic grammar check on subjective answers.
 * Checks for sentence casing, double spaces, and common spelling errors.
 * 
 * @param attemptId - The unique ID of the attempt
 * @returns A score (0-100) and a list of detected errors
 */
export const checkGrammar = async (attemptId: string): Promise<GrammarCheckResult> => {
  const answers = await prisma.answer.findMany({
    where: { attemptId },
  });

  let totalErrors = 0;
  let totalWords = 0;
  const errors: Array<{ message: string; offset: number; length: number }> = [];

  for (const answer of answers) {
    if (answer.textAnswer) {
      const text = answer.textAnswer;
      const words = text.split(/\s+/).filter((w: string) => w.length > 0);
      totalWords += words.length;

      // 1. Check for unnecessary double/multiple spaces
      const doubleSpaceMatches = text.match(/\s{2,}/g);
      if (doubleSpaceMatches) {
        totalErrors += doubleSpaceMatches.length;
      }

      // 2. Check for sentence capitalization
      const sentences = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].trim();
        // Flag sentences if they start with a lowercase letter
        if (sentence.length > 0 && sentence[0] === sentence[0].toLowerCase()) {
          totalErrors++;
        }
      }

      // 3. Check for specific common typos (hardcoded list)
      const commonMistakes = ['teh', 'recieve', 'seperate', 'occured', 'definately'];
      const lowerText = text.toLowerCase();
      commonMistakes.forEach(mistake => {
        const regex = new RegExp(`\\b${mistake}\\b`, 'g');
        const matches = lowerText.match(regex);
        if (matches) {
          totalErrors += matches.length;
        }
      });
    }
  }

  /**
   * Grammar Scoring (based on error density):
   * Higher error rate per word decreases the score progressively.
   */
  const errorRate = totalWords > 0 ? (totalErrors / totalWords) * 100 : 0;
  let score = 100;
  if (errorRate >= 20) score = 25;
  else if (errorRate >= 10) score = 25 + ((20 - errorRate) / 10) * 25;
  else if (errorRate >= 5) score = 50 + ((10 - errorRate) / 5) * 25;
  else score = 75 + ((5 - errorRate) / 5) * 25;

  return {
    score: Math.max(0, Math.min(100, score)),
    errors,
  };
};

/**
 * Detects potential plagiarism by comparing current answers to all other submitted attempts.
 * Also factors in the frequency of 'paste' events recorded by the frontend.
 * 
 * @param attemptId - The unique ID for the current attempt
 * @returns Plagiarism metrics including flag status
 */
export const checkPlagiarism = async (attemptId: string): Promise<PlagiarismCheckResult> => {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: true,
    },
  });

  if (!attempt) {
    return { similarityScore: 0, flagged: false };
  }

  // Factor 1: Frequency of paste events
  const totalPasteCount = attempt.answers.reduce((sum: number, a: any) => sum + a.pasteCount, 0);
  
  // Factor 2: Text similarity with other submissions
  const otherAttempts = await prisma.attempt.findMany({
    where: {
      id: { not: attemptId },
      status: 'SUBMITTED',
    },
    include: {
      answers: true,
    },
  });

  let maxSimilarity = 0;
  let matchedContent = '';
  let sourceAttemptId = '';

  // Cross-reference current answers with every answer for the same question in history
  for (const answer of attempt.answers) {
    if (!answer.textAnswer) continue;

    for (const otherAttempt of otherAttempts) {
      for (const otherAnswer of otherAttempt.answers) {
        // Only compare answers for the exact same question
        if (!otherAnswer.textAnswer || otherAnswer.questionId !== answer.questionId) continue;

        const similarity = calculateTextSimilarity(answer.textAnswer, otherAnswer.textAnswer);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          matchedContent = otherAnswer.textAnswer;
          sourceAttemptId = otherAttempt.id;
        }
      }
    }
  }

  // Penalize the similarity score if pasting was detected frequently
  // Each paste event adds 10% similarity penalty (up to 50% max)
  const pastePenalty = Math.min(totalPasteCount * 10, 50); 
  const finalSimilarityScore = Math.min(maxSimilarity + pastePenalty, 100);

  return {
    similarityScore: finalSimilarityScore,
    matchedContent: matchedContent || undefined,
    source: sourceAttemptId || undefined,
    // Flag if similarity is very high OR if paste events exceed a threshold
    flagged: finalSimilarityScore > 70 || totalPasteCount > 3,
  };
};

/**
 * Calculates text similarity using the Levenshtein Distance algorithm.
 * Returns a percentage 0-100 where 100 is an exact match.
 */
const calculateTextSimilarity = (text1: string, text2: string): number => {
  const s1 = text1.toLowerCase().trim();
  const s2 = text2.toLowerCase().trim();

  if (s1 === s2) return 100;
  if (s1.length === 0 || s2.length === 0) return 0;

  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  return ((maxLength - distance) / maxLength) * 100;
};

/**
 * Classic Levenshtein distance implementation to find edit distance between strings.
 */
const levenshteinDistance = (s1: string, s2: string): number => {
  // Performance Guard: Truncate extremely long strings to prevent OOM or CPU-lock.
  // Levenshtein is O(n*m), so a 10,000 char string would mean 100,000,000 operations.
  const MAX_LENGTH = 1000;
  const str1 = s1.length > MAX_LENGTH ? s1.substring(0, MAX_LENGTH) : s1;
  const str2 = s2.length > MAX_LENGTH ? s2.substring(0, MAX_LENGTH) : s2;

  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
};

/**
 * Assesses the quality of subjective written responses.
 * Looks for word count metrics, vocabulary diversity, and use of logical connectors.
 * 
 * @param attemptId - The unique ID of the attempt
 * @returns An average quality score across all subjective questions
 */
export const evaluatePromptQuality = async (attemptId: string): Promise<number> => {
  const answers = await prisma.answer.findMany({
    where: { attemptId },
    include: {
      question: true,
    },
  });

  let totalScore = 0;
  let subjectiveCount = 0;

  for (const answer of answers) {
    if (answer.question.type === QuestionType.SUBJECTIVE && answer.textAnswer) {
      subjectiveCount++;
      const text = answer.textAnswer;
      
      let score = 50; // Starting base score

      // 1. Length Bonus: More content generally indicates more depth
      const wordCount = text.split(/\s+/).filter((w: string) => w.length > 0).length;
      if (wordCount >= 50) score += 15;
      else if (wordCount >= 30) score += 10;
      else if (wordCount >= 15) score += 5;

      // 2. Structural Bonus: Multiple sentences indicate better formatting
      const sentences = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
      if (sentences.length >= 3) score += 10;

      // 3. Vocabulary Bonus: High ratio of unique words to total words
      const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
      const uniqueWords = new Set(words);
      const diversityRatio = words.length > 0 ? uniqueWords.size / words.length : 0;
      if (diversityRatio > 0.7) score += 15;
      else if (diversityRatio > 0.5) score += 10;
      else if (diversityRatio > 0.3) score += 5;

      // 4. Logical Connector Bonus: Use of advanced transition words
      const connectors = ['because', 'therefore', 'however', 'although', 'furthermore', 'moreover', 'consequently'];
      const hasConnectors = connectors.some(c => text.toLowerCase().includes(c));
      if (hasConnectors) score += 10;

      totalScore += Math.min(100, score);
    }
  }

  // Return 100 if no subjective questions were present
  return subjectiveCount > 0 ? totalScore / subjectiveCount : 100;
};

/**
 * Aggregates all individual evaluation metrics into a single weighted score.
 * 
 * Weights:
 * - Accuracy: 40%
 * - Grammar: 20% 
 * - Plagiarism (inverted): 20%
 * - Typing Speed: 20%
 * 
 * @param attemptId - The attempt to evaluate completely
 * @returns Consolidated evaluation results
 */
export const evaluateAttempt = async (attemptId: string): Promise<EvaluationResult> => {
  // Run all checks in parallel for performance
  const [accuracy, typingSpeed, grammarResult, plagiarismResult, promptQuality] = await Promise.all([
    calculateAccuracy(attemptId),
    calculateTypingSpeed(attemptId),
    checkGrammar(attemptId),
    checkPlagiarism(attemptId),
    evaluatePromptQuality(attemptId),
  ]);

  // Invert plagiarism (lower similarity = higher score)
  const plagiarismScore = 100 - plagiarismResult.similarityScore;

  // Weighted formula
  const finalScore = 
    (accuracy * 0.4) +
    (grammarResult.score * 0.2) +
    (plagiarismScore * 0.2) +
    (typingSpeed * 0.2);

  // Fetch target pass mark from the associated exam
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { exam: true },
  });

  const passed = finalScore >= (attempt?.exam.passMark || 80);

  return {
    accuracy,
    grammar: grammarResult.score,
    plagiarism: plagiarismScore,
    typingSpeed,
    promptQuality,
    finalScore,
    passed,
  };
};

