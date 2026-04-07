import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';

import { AuthInitializer } from '@/components/auth/AuthInitializer';

// Initialize the Inter font with Latin subset
const inter = Inter({ subsets: ['latin'] });

/**
 * Global Metadata
 * Defines the application's SEO title and description.
 */
export const metadata: Metadata = {
  title: 'Annotrix',
  description: 'A comprehensive platform for assessment and evaluation',
};

/**
 * Root Layout Component
 * Wraps all pages in the application.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Global Auth Initialization */}
          <AuthInitializer />
          
          {/* Main content area */}
          <main className="relative z-10">
            {children}
          </main>
          
          {/* Global toast notification system */}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

