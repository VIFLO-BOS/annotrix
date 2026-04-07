/**
 * @file layout.tsx
 * @description The root layout for the entire application.
 * Configures the global font (Inter), metadata, and essential providers like the Toaster.
 */

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

/**
 * Root Layout Component
 * Wraps all pages in the application.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
