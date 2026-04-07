/**
 * @file AuthInitializer.tsx
 * @description Centralized authentication initialization component.
 * Validates the user session once on application mount and manage global loading state.
 */

"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/services/api";

/**
 * Auth Initializer Component
 * Runs global auth checks exactly once at root level.
 */
export function AuthInitializer() {
  const { 
    setUser, 
    setAuthenticated, 
    setLoading, 
    setToken,
    hasHydrated 
  } = useAuthStore();
  
  // Use a ref to ensure the initialization logic only runs once
  const isInitialized = useRef(false);

  useEffect(() => {
    // Only proceed once the store has hydrated from localStorage
    if (!hasHydrated || isInitialized.current) return;
    
    isInitialized.current = true;

    const initSession = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Sync memory token with storage token
        setToken(token);
        
        // Validate with the backend
        const response = await api.getMe();
        setUser(response.user);
        setAuthenticated(true);
      } catch (error) {
        // Clear corrupt or expired session
        localStorage.removeItem("token");
        setUser(null);
        setAuthenticated(false);
        setToken(null);
      } finally {
        // Essential: Toggle loading to false after verification (success or failure)
        setLoading(false);
      }
    };

    initSession();
  }, [hasHydrated, setUser, setAuthenticated, setLoading, setToken]);

  // This component doesn't render any UI
  return null;
}
