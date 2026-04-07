/**
 * @file Sidebar.tsx
 * @description Application sidebar navigation.
 * Provides links to key dashboard areas, with distinct navigation 
 * sets for standard users and administrators.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  LogOut,
  Shield,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/button';

/**
 * Props for the Sidebar component.
 */
interface SidebarProps {
  isAdmin?: boolean;
}

/**
 * Navigation links available to regular users.
 */
const userLinks = [
  { href: '/annotator', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/annotator/exam', label: 'Examination', icon: FileText },
  { href: '/annotator/results', label: 'Results', icon: BarChart3 },
];

/**
 * Navigation links available to administrators.
 */
const adminLinks = [
  { href: '/admin', label: 'Admin Dashboard', icon: Shield },
  { href: '/admin/exams', label: 'Exam Management', icon: ClipboardList },
  { href: '/admin/users', label: 'User Management', icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

/**
 * Sidebar component that adapts its navigation items based on the user's role.
 * 
 * @param isAdmin - Boolean flag to toggle admin navigation
 */
export function Sidebar({ isAdmin }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuthStore();
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();

  // Select the appropriate set of links
  const links = isAdmin ? adminLinks : userLinks;

  return (
    <aside className={cn(
      "glass-card border-r-0 rounded-none min-h-screen flex flex-col relative z-20 transition-all duration-300",
      isSidebarCollapsed ? "w-20" : "w-64"
    )}>
      {/* Brand / Logo Section */}
      <div className={cn("p-6 pb-8 flex items-center justify-between", isSidebarCollapsed && "justify-center")}>
        <Link href={isAdmin ? "/admin" : "/annotator"} className="flex items-center space-x-3 group min-w-0">
          <div className="w-10 h-10 bg-primary/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-primary/20 shrink-0 transition-all group-hover:scale-105">
            <span className="text-primary font-semibold text-lg">AX</span>
          </div>
          {!isSidebarCollapsed && (
            <span className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors truncate">Annotrix</span>
          )}
        </Link>
      </div>

      {/* Toggle Button */}
      <div className="absolute -right-3 top-20 z-10">
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={toggleSidebar}
          className="h-6 w-6 rounded-full shadow-lg border border-white/5 bg-background p-0.5 hover:scale-110 transition-transform"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-hidden">
        {!isSidebarCollapsed && (
          <p className="px-4 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-3">Main</p>
        )}
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all group relative',
                isSidebarCollapsed ? "justify-center space-x-0" : "space-x-3",
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground'
              )}
            >
              <Icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-105", isActive ? "text-primary" : "text-muted-foreground/60")} />
              {!isSidebarCollapsed && <span className="truncate">{link.label}</span>}
              {!isSidebarCollapsed && isActive && (
                <div className="absolute right-4 w-1 h-1 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Logout Action */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={logout}
          className={cn(
            "flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-all group shadow-none",
            isSidebarCollapsed ? "justify-center space-x-0" : "space-x-3"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
          {!isSidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

