/**
 * @file Header.tsx
 * @description Main application header component.
 * Displays the current page title, user eligibility status, and a 
 * profile dropdown with account actions.
 */

'use client';

import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';

/**
 * Shared Header component for the dashboard layout.
 */
export function Header() {
  const { user, logout } = useAuthStore();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-16 bg-background/30 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Dynamic Title based on User Role */}
      <div className="flex items-center gap-3">
        <div className="h-6 w-1 bg-primary rounded-full hidden sm:block" />
        <h1 className="text-lg font-semibold text-foreground">
          {user?.role === 'ADMIN' ? 'Administrator' : 'Annotrix Portal'}
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {user && (
          <>
            {/* Eligibility Status Badge */}
            {user?.role !== "ADMIN" && (
              <Badge 
                variant={user.status === 'ELIGIBLE' ? 'success' : 'destructive'}
                className="rounded-full px-3 py-1 font-medium text-[9px] uppercase tracking-wider"
              >
                {user.status === 'ELIGIBLE' ? 'Eligible' : 'Disqualified'}
              </Badge>
            )}

            {/* Global Theme Toggle */}
            <ThemeToggle />

            {/* Profile Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-2.5 focus:outline-none group">
                <div className="text-right hidden md:block">
                  <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">{user.fullName}</p>
                  <p className="text-[9px] font-medium text-muted-foreground/60 uppercase">{user.role}</p>
                </div>
                <Avatar className="h-9 w-9 border border-primary/20 p-0.5 group-hover:border-primary/50 transition-all">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass shadow-2xl border-white/5 p-1.5">
                <DropdownMenuLabel className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem className="rounded-lg py-2.5 focus:bg-primary/10 transition-colors cursor-pointer text-sm">
                  <User className="mr-2.5 h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg py-2.5 focus:bg-primary/10 transition-colors cursor-pointer text-sm">
                  <Settings className="mr-2.5 h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">Preferences</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={logout} className="rounded-lg py-2.5 focus:bg-destructive/10 text-destructive focus:text-destructive transition-colors cursor-pointer text-sm">
                  <LogOut className="mr-2.5 h-3.5 w-3.5" />
                  <span className="font-medium">Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </header>
  );
}

