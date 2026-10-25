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
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Dynamic Title based on User Role */}
      <div className="flex items-center gap-3">
        <div className="h-5 w-1 bg-primary rounded-full hidden sm:block" />
        <h1 className="text-sm font-semibold text-foreground">
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
                className="rounded-md px-2 py-0.5 text-xs"
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
                  <p className="text-sm font-medium text-foreground">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                </div>
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-lg border border-border p-1">
                <DropdownMenuLabel className="px-3 py-1.5 text-xs font-medium text-muted-foreground">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem className="rounded-md py-2 focus:bg-muted cursor-pointer text-sm">
                  <User className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-md py-2 focus:bg-muted cursor-pointer text-sm">
                  <Settings className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  Preferences
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={logout} className="rounded-md py-2 focus:bg-destructive/10 text-destructive cursor-pointer text-sm">
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </header>
  );
}

