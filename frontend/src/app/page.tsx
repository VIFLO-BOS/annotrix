/**
 * @file page.tsx
 * @description The root entry point for the application.
 * Dynamically redirects users to their respective dashboards based on role and authentication status.
 */

"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * Root Home Component
 * Standard Next.js entry point with intelligent redirection logic.
 */
export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, hasHydrated } = useAuthStore();

  useEffect(() => {
    // Only proceed after hydration and initial validation have finished
    if (hasHydrated && !isLoading) {
      if (isAuthenticated) {
        if (user?.role === 'ADMIN') {
          router.replace('/admin');
        } else {
          router.replace('/annotator');
        }
      } else {
        router.replace('/login');
      }
    }
  }, [hasHydrated, isLoading, isAuthenticated, user, router]);

  // Loading state placeholder while redirecting
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 animate-in fade-in duration-500">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-[3px] border-primary/10 rounded-full" />
        <div className="absolute inset-0 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground/40 animate-pulse">
        Synchronizing session...
      </p>
    </div>
  );
}
