/**
 * @file utils.ts
 * @description Common utility functions for the frontend, including 
 * UI styling helpers and data formatting.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS classes safely using clsx and tailwind-merge.
 * Prevents class conflicts by ensuring the last-defined class wins.
 * 
 * @param inputs - Variadic list of class names, objects, or arrays
 * @returns A single consolidated class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string or object into a human-readable English format.
 * Example: 'Jan 1, 2024'
 * 
 * @param date - The date to format
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats a duration in seconds into a MM:SS string.
 * Used for exam timers and elapsed time displays.
 * 
 * @param seconds - Total seconds
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Calculates typing speed in Words Per Minute (WPM).
 * 
 * @param wordCount - Total words typed
 * @param timeInSeconds - Time elapsed during typing
 * @returns Rounded WPM value
 */
export function calculateWPM(wordCount: number, timeInSeconds: number): number {
  if (timeInSeconds === 0) return 0;
  return Math.round((wordCount / timeInSeconds) * 60);
}

