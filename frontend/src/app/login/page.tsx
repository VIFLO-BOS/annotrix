/**
 * @file page.tsx
 * @description The user login page.
 * Provides a form for existing users to authenticate.
 * Manages JWT storage and global auth state initialization upon success.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/services/api";
import { Loader2 } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Sparkles } from "lucide-react";

/**
 * Login Page Component
 * Redesigned with glassmorphism and theme support.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const { setUser, setToken, setAuthenticated, isAuthenticated, user, hasHydrated, isLoading: isAuthLoading } =
    useAuthStore();

  /**
   * Redirect to dashboard if the user is already authenticated.
   */
  useEffect(() => {
    // Only redirect if hydration and global validation have finished
    if (hasHydrated && !isAuthLoading && isAuthenticated) {
      if (!user?.emailVerified) {
        router.push("/verify");
      } else if (user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/annotator");
      }
    }
  }, [hasHydrated, isAuthLoading, isAuthenticated, router, user]);

  /**
   * Handles the login form submission.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.login({ email, password });
      localStorage.setItem("token", response.token);
      setToken(response.token);
      setUser(response.user);
      setAuthenticated(true);

      toast({
        title: "Success",
        description: "Welcome back!",
      });

      if (!response.user.emailVerified) {
        router.push("/verify");
      } else if (response.user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/annotator");
      }
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error.response?.data?.error || "Invalid credentials provided.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden "
      style={{
        background:
          "linear-gradient(rgba(2, 6, 23, 0.5), rgba(2, 6, 23, 3)), url('https://i.pinimg.com/736x/6a/f7/a4/6af7a44dbdbd4a4faa742b9e88119a05.jpg')",backgroundSize:"cover", backgroundPosition:"100% 30%", backgroundRepeat:"no-repeat" 
      }}
    >
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/20 blur-[120px] pointer-events-none animate-pulse" />



      <Card className="w-full max-w-sm border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-500 bg-white/5 backdrop-blur-xl rounded-2xl">
        <CardHeader className="space-y-4 pb-8">
          <div className="flex justify-center mb-2">
            <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="space-y-1 text-center">
            <CardTitle className="text-2xl font-semibold tracking-normal text-white">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-[13px] font-medium text-white/50">
              Enter secure credentials to access your portal
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[10px] font-semibold uppercase tracking-widest text-white/60 ml-1"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 !bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30 focus:border-white/20 focus:ring-0"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label
                  htmlFor="password"
                  className="text-[10px] font-semibold uppercase tracking-widest text-white/60"
                >
                  Password
                </Label>
                <Link
                  href="#"
                  className="text-[9px] font-semibold text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 !bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30 focus:border-white/20 focus:ring-0"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-6 pb-8">
            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold rounded-xl shadow-lg shadow-primary/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Authorize Access"
              )}
            </Button>
            <div className="text-center">
              <p className="text-[11px] font-medium text-white/50">
                New to the platform?{" "}
                <Link
                  href="/register"
                  className="text-primary font-medium hover:underline"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
