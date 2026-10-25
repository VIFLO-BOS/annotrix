"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2, ShieldCheck, Mail } from "lucide-react";

export default function VerifyOTPPage() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, setUser, hasHydrated, isAuthenticated } = useAuthStore();
  const autoSentRef = React.useRef(false);

  const handleSendOTP = async () => {
    setIsSending(true);
    try {
      await api.sendOtp("EMAIL");
      toast({
        title: "OTP Sent",
        description: "Check your email for the verification code.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send OTP",
        description: error.response?.data?.error || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push("/login");
    } else if (hasHydrated && isAuthenticated && user?.emailVerified) {
        if(user?.role === "ADMIN") {
            router.push("/admin");
        } else {
            router.push("/annotator");
        }
    } else if (hasHydrated && isAuthenticated && !user?.emailVerified && !autoSentRef.current) {
      autoSentRef.current = true;
      handleSendOTP();
    }
  }, [hasHydrated, isAuthenticated, router, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) return;

    setIsLoading(true);
    try {
      await api.verifyOtp(code, "EMAIL");
      
      // Fetch the updated user profile to ensure all verified flags are synced
      const meResponse = await api.getMe();
      if (meResponse.user) {
        setUser(meResponse.user);
      }

      toast({
        title: "Success",
        description: "Your email has been verified.",
      });
      
      if (meResponse.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/annotator");
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.response?.data?.error || "Invalid or expired code.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasHydrated || !isAuthenticated) return null;

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
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-green-500/10 blur-[120px] pointer-events-none animate-pulse" />

      <Card className="w-full max-w-sm border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-500 bg-white/5 backdrop-blur-xl rounded-2xl">
        <CardHeader className="space-y-4 pb-8">
          <div className="flex justify-center mb-2">
            <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="space-y-1 text-center">
            <CardTitle className="text-2xl font-semibold tracking-normal text-white">
              Verify Account
            </CardTitle>
            <CardDescription className="text-[13px] font-medium text-white/50">
              Enter the 6-digit code sent to your email.
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="code"
                className="text-[10px] font-semibold uppercase tracking-widest text-white/60 ml-1"
              >
                Verification Code
              </Label>
              <Input
                id="code"
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="h-14 text-center text-2xl tracking-[0.5em] !bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:ring-0"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pb-8">
            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold rounded-xl shadow-lg shadow-primary/20"
              disabled={isLoading || code.length < 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 text-sm font-semibold rounded-xl border-white/10 text-white hover:bg-white/10 bg-transparent hover:text-white"
              onClick={handleSendOTP}
              disabled={isSending}
            >
              {isSending ? (
                 <>
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 Sending...
               </>
              ) : (
                <>
                 <Mail className="mr-2 h-4 w-4 " />
                 Resend Code
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
