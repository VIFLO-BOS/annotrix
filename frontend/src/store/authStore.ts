/**
 * @file authStore.ts
 * @description Global state management for user authentication using Zustand.
 * Handles user profile, JWT tokens, and login/logout lifecycle with persistence.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

/**
 * Interface representing the structure of the authentication state.
 */
interface AuthState {
  // The currently logged-in user object
  user: User | null;
  // The JWT token for API authorization
  token: string | null;
  // Flag indicating if a user is currently logged in
  isAuthenticated: boolean;
  // Loading state (e.g., while verifying session on load)
  isLoading: boolean;
  // Flag indicating if the store has hydrated from localStorage
  hasHydrated: boolean;
  // Updates the stored user profile
  setUser: (user: User | null) => void;
  // Updates the JWT token
  setToken: (token: string | null) => void;
  // Toggles authentication status
  setAuthenticated: (value: boolean) => void;
  // Toggles the global loading overlay
  setLoading: (value: boolean) => void;
  // Toggles the hydration status
  setHasHydrated: (value: boolean) => void;
  // Resets the store and clears localStorage on logout
  logout: () => void;
}

/**
 * Auth Store Hook
 * Uses Zustand's 'persist' middleware to sync login state with localStorage.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      hasHydrated: false,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setLoading: (value) => set({ isLoading: value }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
      logout: () => {
        // Clear tokens from browser storage
        localStorage.removeItem('token');
        // Reset memory state
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage', // Key used in localStorage
      // Define specific parts of the state to persist across refreshes
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

