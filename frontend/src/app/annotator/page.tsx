"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';
import { DashboardStats } from '@/types';
import { 
  ClipboardList, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Clock,
  Award,
  Zap,
  ShieldCheck,
  BookOpen,
  MousePointer2,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Dashboard Page Component
 * Redesigned with glassmorphism and theme support.
 */
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.getDashboardStats();
      setStats(response.stats);
    } catch (error: any) {
      toast({
        title: 'Network Synchronization Error',
        description: error.response?.data?.error || 'Unable to retrieve your performance profile.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="p-6 rounded-full bg-destructive/10 mb-6">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <h3 className="text-2xl font-bold tracking-tight">No results found</h3>
        <p className="text-muted-foreground mt-2 max-w-xs">We encountered an issue retrieving your evaluation metrics. Please attempt a manual reload.</p>
        <Button variant="outline" className="mt-8 rounded-full h-11 px-8 glass" onClick={() => window.location.reload()}>Reload</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="space-y-1">
          <h2 className="text-3xl font-semibold text-foreground">
             Welcome, {user?.fullName?.split(' ')[0]}
          </h2>
          <p className="text-muted-foreground flex items-center gap-2 font-medium">
             <Zap className="w-4 h-4 text-primary" /> Welcome to Annotrix
          </p>
        </div>
        {stats.canTakeExam && (
          <Button 
            onClick={() => router.push('/annotator/exam')}
            className="rounded-full h-10 px-8 font-medium text-xs uppercase tracking-wider shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 group"
          >
            <ClipboardList className="mr-2 h-3.5 w-3.5 stroke-[2px] group-hover:rotate-12 transition-transform" />
            Take Exam
          </Button>
        )}
      </div>

      {/* Stats Grid: Key metrics visualized in cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Attempts Used Card */}
        <Card className="border-none shadow-glass glass-card hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Attempts</CardTitle>
            <ClipboardList className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight mb-2">
              {stats.totalAttempts} <span className="text-muted-foreground/30 text-base">/ {stats.maxAttempts}</span>
            </div>
            <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-primary transition-all duration-1000" 
                 style={{ width: `${(stats.totalAttempts / stats.maxAttempts) * 100}%` }} 
               />
            </div>
          </CardContent>
        </Card>

        {/* Remaining Attempts Card */}
        <Card className="border-none shadow-glass glass-card hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Remaining Attempts</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight mb-1">{stats.remainingAttempts}</div>
            <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest">
              Attempts Remaining
            </p>
          </CardContent>
        </Card>

        {/* Eligibility Status Card */}
        <Card className="border-none shadow-glass glass-card hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Status</CardTitle>
            {stats.isEligible ? (
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={stats.isEligible ? 'success' : 'destructive'} className="rounded-full px-3 py-1 font-medium text-[10px] uppercase tracking-widest border-none">
                {stats.status === 'ELIGIBLE' ? 'Eligible' : 'Disqualified'}
              </Badge>
            </div>
            <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest">
              Account Status
            </p>
          </CardContent>
        </Card>

        {/* Last Evaluated Score Card */}
        <Card className="border-none shadow-glass glass-card hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Last Attempt</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {stats.lastAttempt ? (
              <div className="flex items-end gap-2.5">
                <div className="text-2xl font-semibold tracking-tight leading-none">
                   {stats.lastAttempt.score.toFixed(0)}%
                </div>
                <Badge 
                  variant={stats.lastAttempt.passed ? 'success' : 'destructive'}
                  className="rounded-full px-2 py-0.5 font-medium text-[8px] uppercase border-none"
                >
                  {stats.lastAttempt.passed ? 'Passed' : 'Failed'}
                </Badge>
              </div>
            ) : (
              <p className="text-sm font-semibold text-muted-foreground/40 uppercase">No Data Logged</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Exam Availability Section (Detailed status box) */}
        <Card className="lg:col-span-4 border-none shadow-glass glass-card overflow-hidden">
          <div className={cn(
             "h-1.5 w-full",
             stats.canTakeExam ? "bg-emerald-500" : "bg-destructive"
          )} />
           <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold uppercase tracking-wider text-muted-foreground/60">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col items-center justify-center py-4 gap-5">
               <div className={cn(
                 "p-4 rounded-2xl shrink-0 transition-transform hover:scale-105 duration-500",
                 stats.canTakeExam ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
               )}>
                  {stats.canTakeExam ? <CheckCircle className="h-9 w-9" /> : <XCircle className="h-9 w-9" />}
               </div>
               <div className="text-center space-y-2">
                  <h4 className={cn(
                    "text-lg font-semibold uppercase",
                    stats.canTakeExam ? "text-emerald-500" : "text-destructive"
                  )}>
                    {stats.canTakeExam ? 'Eligible' : 'Not Eligible'}
                  </h4>
                  <p className="text-xs font-medium text-muted-foreground/60 leading-relaxed px-4">
                    {stats.canTakeExam 
                      ? 'You are eligible to take an exam. Good luck!' 
                      : !stats.isEligible 
                        ? 'Your account has been disqualified from active evaluation.' 
                        : stats.remainingAttempts === 0 
                          ? 'All allocated attempts have been exhausted.' 
                          : 'Administrative lock engaged on current manifests.'}
                  </p>
               </div>
            </div>
            {stats.canTakeExam && (
               <button 
                 className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium transition-all hover:bg-primary/90 focus:ring-2 focus:ring-primary/20 active:scale-95" 
                 onClick={() => router.push('/annotator/exam')}
               >
                 Take Exam
               </button>
            )}
          </CardContent>
        </Card>

        {/* Platform Instructions Section */}
        <Card className="lg:col-span-8 border-none shadow-glass glass-card">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-base font-semibold uppercase flex items-center gap-2">
               <BookOpen className="w-4 h-4 text-primary" /> Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <InstructionItem 
                index={1} 
                title="Time Limit" 
                desc="You have 20 minutes to complete each exam." 
                icon={Clock} 
                color="text-blue-500" 
              />
              <InstructionItem 
                index={2} 
                title="Pass Mark" 
                desc="You need 80% accuracy to pass the verification." 
                icon={TrendingUp} 
                color="text-emerald-500" 
              />
              <InstructionItem 
                index={3} 
                title="Max Attempts" 
                desc="You have a maximum of 3 attempts per exam." 
                icon={Activity} 
                color="text-orange-500" 
              />
              <InstructionItem 
                index={4} 
                title="Scoring" 
                desc="Automated scoring based on grammar, logic, speed & originality." 
                icon={Zap} 
                color="text-purple-500" 
              />
            </div>
            
            <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-3">
               <div className="p-1.5 rounded-lg bg-primary/10">
                 <MousePointer2 className="w-3.5 h-3.5 text-primary" />
               </div>
               <p className="text-[9px] font-medium text-primary/70 uppercase tracking-wider leading-relaxed">
                 By initializing, you agree to the automated observation and integrity monitoring protocols.
               </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InstructionItem({ index, title, desc, icon: Icon, color }: { index: number, title: string, desc: string, icon: any, color: string }) {
  return (
    <div className="flex gap-4 group">
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-xl bg-foreground/[0.03] border border-white/5 flex items-center justify-center transition-all group-hover:scale-105 group-hover:bg-foreground/[0.06]">
          <Icon className={cn("w-4 h-4 transition-colors", color)} />
        </div>
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full glass border border-white/10 flex items-center justify-center text-[9px] font-semibold text-primary shadow-lg ring-2 ring-background">
          {index}
        </div>
      </div>
      <div className="space-y-1">
        <h4 className="text-base font-medium tracking-normal">{title}</h4>
        <p className="text-xs font-medium text-muted-foreground/60 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

