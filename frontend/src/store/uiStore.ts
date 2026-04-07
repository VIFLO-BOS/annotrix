/**
 * @file uiStore.ts
 * @description Global state management for UI preferences using Zustand.
 * Handles sidebar collapse state with persistence.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (value: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (value) => set({ isSidebarCollapsed: value }),
    }),
    {
      name: 'ui-storage', // Key used in localStorage
    }
  )
);
