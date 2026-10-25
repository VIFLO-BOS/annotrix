/**
 * @file layout.tsx
 * @description The root layout for the entire application.
 * Configures the global font (Inter), metadata, and essential providers like the Toaster.
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/authStore";

/**
 * Root Layout Component
 * Wraps all pages in the application.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && !isLoading && !isAuthenticated) {
      router.replace("/login");
    } else if (hasHydrated && !isLoading && isAuthenticated && !user?.emailVerified) {
      router.replace("/verify");
    } else if (hasHydrated && !isLoading && isAuthenticated && user?.role !== "ADMIN") {
      router.replace("/annotator");
    }
  }, [hasHydrated, isLoading, isAuthenticated, router, user]);

  if (isLoading || !hasHydrated || !isAuthenticated || user?.role !== "ADMIN") {
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
    <div className="flex min-h-screen">
      {/* Navigation Sidebar (Tailored for Admin/User roles) */}
      <Sidebar isAdmin={true} />

      <div className="flex-1 flex flex-col relative z-10 transition-all duration-300">
        {/* Global Dashboard Header */}
        <Header />

        {/* Page Content area */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
