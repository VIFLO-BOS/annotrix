/**
 * @file layout.tsx
 * @description The protected layout for all dashboard-related pages.
 * Ensures the user is authenticated before rendering protected content.
 * Provides the shared sidebar and header structure.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useAuthStore } from "@/store/authStore";

/**
 * Dashboard Layout Component
 * Automatically redirects to /login if the user is not authenticated.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, hasHydrated } = useAuthStore();

  /**
   * Protected Route Guard:
   * Redirects unauthorized users to the login page.
   */
  useEffect(() => {
    // Only redirect once initialization has finished
    if (hasHydrated && !isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hasHydrated, isLoading, isAuthenticated, router]);

  // Prevent rendering protected content while the session is being initialized from persistence
  if (isLoading || !hasHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen animate-in fade-in duration-500">
      {/* Navigation Sidebar (Tailored for Admin/User roles) */}
      <Sidebar isAdmin={user?.role === "ADMIN"} />
      
      <div className="flex-1 flex flex-col relative z-10 transition-all duration-300">
        {/* Global Dashboard Header */}
        <Header />
        
        {/* Page Content area */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
