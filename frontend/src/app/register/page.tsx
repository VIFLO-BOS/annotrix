/**
 * @file page.tsx
 * @description The user registration page.
 * Provides a multi-field form for new users to create an account.
 * Includes client-side validation (e.g., password matching) and automatic login on success.
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
import { Sparkles, UserPlus } from "lucide-react";

/**
 * Register Page Component
 * Redesigned with glassmorphism and theme support.
 */
export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    nin: "",
    password: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, setUser, setToken, setAuthenticated, isAuthenticated } =
    useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      if (!user?.emailVerified) {
        router.push("/verify");
      } else if (user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/annotator");
      }
    }
  }, [isAuthenticated, router, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.register({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        nin: formData.nin,
      });

      localStorage.setItem("token", response.token);
      setToken(response.token);
      setUser(response.user);
      setAuthenticated(true);

      toast({
        title: "Account Created",
        description: "Welcome to the platform!",
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
        title: "Registration Failed",
        description: error.response?.data?.error || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(rgba(2, 6, 23, 0.5), rgba(2, 6, 23, 3)), url('https://i.pinimg.com/736x/6a/f7/a4/6af7a44dbdbd4a4faa742b9e88119a05.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "100% 30%",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-500/10 blur-[120px] pointer-events-none animate-pulse" />

      <Card className="w-full max-w-md border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-500 bg-white/5 backdrop-blur-xl rounded-2xl">
        <CardHeader className="space-y-4 pb-8">
          <div className="flex justify-center mb-2">
            <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="space-y-1 text-center">
            <CardTitle className="text-2xl font-semibold tracking-normal text-white">
              Create Account
            </CardTitle>
            <CardDescription className="text-[13px] font-medium text-white/50">
              Join the elite assessment ecosystem
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="fullName"
                  className="text-[10px] font-semibold uppercase tracking-widest text-white/60 ml-1"
                >
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="h-11 !bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30 focus:border-white/20 focus:ring-0"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-[10px] font-semibold uppercase tracking-widest text-white/60 ml-1"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="h-11 !bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30 focus:border-white/20 focus:ring-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-[10px] font-semibold uppercase tracking-widest text-white/60 ml-1"
              >
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange}
                required
                className="h-11 !bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30 focus:border-white/20 focus:ring-0"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="nin"
                className="text-[10px] font-semibold uppercase tracking-widest text-white/60 ml-1"
              >
                NIN (National ID)
              </Label>
              <Input
                id="nin"
                type="text"
                placeholder="12345678901"
                value={formData.nin}
                onChange={handleChange}
                required
                maxLength={11}
                className="h-11 !bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30 focus:border-white/20 focus:ring-0"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-[10px] font-semibold uppercase tracking-widest text-white/60 ml-1"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="h-11 !bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30 focus:border-white/20 focus:ring-0"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-[10px] font-semibold uppercase tracking-widest text-white/60 ml-1"
                >
                  Confirm
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="h-11 !bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30 focus:border-white/20 focus:ring-0"
                />
              </div>
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
                  Creating identity...
                </>
              ) : (
                "Join Now"
              )}
            </Button>
            <div className="text-center">
              <p className="text-[11px] font-medium text-white/50">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-primary font-medium hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
