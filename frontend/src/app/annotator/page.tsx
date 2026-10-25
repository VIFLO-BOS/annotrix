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
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="p-4 rounded-lg bg-destructive/10 mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold">No results found</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">We encountered an issue retrieving your evaluation metrics.</p>
        <Button variant="outline" className="mt-6 h-9 px-4 rounded-lg" onClick={() => window.location.reload()}>Reload</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 flex-wrap">
             Welcome, {user?.fullName?.split(' ')[0]}
             {(user?.emailVerified && user?.ninVerified) && (
               <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 px-2 py-0.5 rounded-md text-xs border border-blue-500/20">
                 <ShieldCheck className="w-3 h-3 mr-1" /> Verified
               </Badge>
             )}
          </h2>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
             <Zap className="w-4 h-4 text-primary" /> Welcome to Annotrix
          </p>
        </div>
        {stats.canTakeExam && (
          <Button 
            onClick={() => router.push('/annotator/exam')}
            className="h-9 px-4 text-sm rounded-lg"
          >
            <ClipboardList className="mr-2 h-3.5 w-3.5" />
            Take Exam
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Attempts Used Card */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Attempts</CardTitle>
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <ClipboardList className="h-3.5 w-3.5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-semibold tracking-tight">
              {stats.totalAttempts} <span className="text-muted-foreground text-sm">/ {stats.maxAttempts}</span>
            </div>
            <div className="mt-3 h-1 w-full bg-muted rounded-full overflow-hidden">
               <div 
                 className="h-full bg-primary rounded-full transition-all duration-1000" 
                 style={{ width: `${(stats.totalAttempts / stats.maxAttempts) * 100}%` }} 
               />
            </div>
          </CardContent>
        </Card>

        {/* Remaining Attempts Card */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Remaining</CardTitle>
            <div className="p-1.5 bg-orange-500/10 rounded-lg">
              <Clock className="h-3.5 w-3.5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-semibold tracking-tight">{stats.remainingAttempts}</div>
            <p className="text-xs text-muted-foreground mt-1">Attempts remaining</p>
          </CardContent>
        </Card>

        {/* Eligibility Status Card */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Status</CardTitle>
            {stats.isEligible ? (
              <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              </div>
            ) : (
              <div className="p-1.5 bg-destructive/10 rounded-lg">
                <AlertCircle className="h-3.5 w-3.5 text-destructive" />
              </div>
            )}
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Badge variant={stats.isEligible ? 'success' : 'destructive'} className="rounded-md px-2 py-0.5 text-xs">
              {stats.status === 'ELIGIBLE' ? 'Eligible' : 'Disqualified'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">Account status</p>
          </CardContent>
        </Card>

        {/* Last Evaluated Score Card */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Last Attempt</CardTitle>
            <div className="p-1.5 bg-purple-500/10 rounded-lg">
              <Award className="h-3.5 w-3.5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {stats.lastAttempt ? (
              <div className="flex items-end gap-2">
                <div className="text-2xl font-semibold tracking-tight leading-none">
                   {stats.lastAttempt.score.toFixed(0)}%
                </div>
                <Badge 
                  variant={stats.lastAttempt.passed ? 'success' : 'destructive'}
                  className="rounded-md px-2 py-0.5 text-xs"
                >
                  {stats.lastAttempt.passed ? 'Passed' : 'Failed'}
                </Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data logged</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Exam Availability Section */}
        <Card className="lg:col-span-4 glass-card overflow-hidden">
          <div className={cn(
             "h-1 w-full",
             stats.canTakeExam ? "bg-emerald-500" : "bg-destructive"
          )} />
          <CardHeader className="border-b border-border px-4 py-3">
            <CardTitle className="text-sm font-medium">Eligibility</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col items-center justify-center py-4 gap-3">
               <div className={cn(
                 "p-3 rounded-lg shrink-0",
                 stats.canTakeExam ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
               )}>
                  {stats.canTakeExam ? <CheckCircle className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
               </div>
               <div className="text-center space-y-1">
                  <h4 className={cn(
                    "text-sm font-semibold",
                    stats.canTakeExam ? "text-emerald-500" : "text-destructive"
                  )}>
                    {stats.canTakeExam ? 'Eligible' : 'Not Eligible'}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed px-2">
                    {stats.canTakeExam 
                      ? 'You are eligible to take an exam. Good luck!' 
                      : !stats.isEligible 
                        ? 'Your account has been disqualified.' 
                        : stats.remainingAttempts === 0 
                          ? 'All attempts have been exhausted.' 
                          : 'Administrative lock on current exams.'}
                  </p>
               </div>
            </div>
            {stats.canTakeExam && (
               <Button 
                 className="w-full h-9 rounded-lg text-sm" 
                 onClick={() => router.push('/annotator/exam')}
               >
                 Take Exam
               </Button>
            )}
          </CardContent>
        </Card>

        {/* Platform Instructions Section */}
        <Card className="lg:col-span-8 glass-card">
          <CardHeader className="border-b border-border px-4 py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
               <BookOpen className="w-4 h-4 text-primary" /> Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
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
            
            <div className="mt-6 p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-3">
               <div className="p-1.5 rounded-md bg-primary/10">
                 <MousePointer2 className="w-3.5 h-3.5 text-primary" />
               </div>
               <p className="text-xs text-primary/70 leading-relaxed">
                 By starting, you agree to automated observation and integrity monitoring.
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
    <div className="flex gap-3">
      <div className="relative shrink-0">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          <Icon className={cn("w-4 h-4", color)} />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-medium ring-2 ring-background">
          {index}
        </div>
      </div>
      <div className="space-y-0.5">
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

