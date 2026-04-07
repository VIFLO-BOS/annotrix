/**
 * @file page.tsx
 * @description The granular analytics reporting interface for administrators.
 * Offers deep-dive visualizations into system performance, including 
 * categorical score averages (Accuracy, Grammar, Speed, Originality) 
 * and real-time pass/fail distribution tracking.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Award,
  Clock,
  RefreshCw,
  BarChart3,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Interface representing the detailed platform analytics schema.
 */
interface Analytics {
  totalUsers: number;
  totalExams: number;
  totalAttempts: number;
  passCount: number;
  failCount: number;
  disqualifiedCount: number;
  passRate: number;
  averageScores: {
    finalScore: number;
    accuracy: number;
    grammar: number;
    plagiarism: number;
    typingSpeed: number;
  };
  recentAttempts: Array<{
    id: string;
    user: { fullName: string; email: string };
    exam: { title: string };
    score: { finalScore: number; passed: boolean } | null;
    createdAt: string;
  }>;
  flaggedPlagiarism: number;
}

/**
 * Admin Analytics Page Component
 * Redesigned with glassmorphism and refined sizing.
 */
export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  /**
   * Fetches the comprehensive analytics payload from the backend.
   */
  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await api.getAnalytics();
      setAnalytics(response.analytics);
    } catch (error: any) {
      toast({
        title: 'Sync Error',
        description: error.response?.data?.error || 'Failed to synchronize real-time analytics.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Render: Loading State
   */
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground animate-pulse">Loading Analytics</p>
      </div>
    );
  }

  /**
   * Render: Error/Empty State
   */
  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="p-6 rounded-full bg-destructive/10 mb-6">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        <h3 className="text-2xl font-bold tracking-tight">Analytics Unavailable</h3>
        <p className="text-muted-foreground mt-2 max-w-xs">We encountered an issue retrieving platform performance metrics.</p>
        <Button onClick={fetchAnalytics} className="mt-6 rounded-full h-10 px-8">Try Refreshing</Button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-semibold text-foreground">
            Platform Analytics
          </h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
             <BarChart3 className="w-3.5 h-3.5" /> High-fidelity performance reporting and system tracking
          </p>
        </div>
        <Button 
          onClick={fetchAnalytics} 
          variant="outline" 
          className="rounded-full glass h-9 px-5 border-white/5 font-medium text-xs transition-all hover:scale-105"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-2" />
          Synchronize Data
        </Button>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Users", value: analytics.totalUsers, sub: `${analytics.disqualifiedCount} restricted`, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Total Exams", value: analytics.totalExams, sub: "System Manifests", icon: FileText, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Total Attempts", value: analytics.totalAttempts, sub: "Historical Throughput", icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
          { label: "Global Pass Rate", value: `${analytics.passRate.toFixed(1)}%`, sub: "Performance Baseline", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10", progress: analytics.passRate }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-glass glass-card group hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{stat.label}</CardTitle>
              <div className={cn("p-1.5 rounded-xl transition-colors group-hover:bg-opacity-20", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight mb-1">{stat.value}</div>
              <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">{stat.sub}</p>
              {stat.progress !== undefined && (
                <div className="mt-4 h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary animate-progress-grow" 
                    style={{ width: `${stat.progress}%` }} 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-glass glass-card">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-muted-foreground/60">
              <ActivityIcon className="w-4 h-4 text-primary" /> Outcome Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Successful Completions</span>
                  </div>
                  <span className="text-primary">{analytics.passCount}</span>
                </div>
                <div className="h-2.5 w-full bg-foreground/5 rounded-full overflow-hidden">
                  <Progress 
                    value={(analytics.passCount / Math.max(1, (analytics.passCount + analytics.failCount))) * 100} 
                    className="h-full bg-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-destructive" />
                    <span>Unsuccessful Attempts</span>
                  </div>
                  <span className="text-primary">{analytics.failCount}</span>
                </div>
                <div className="h-2.5 w-full bg-foreground/5 rounded-full overflow-hidden">
                  <Progress 
                    value={(analytics.failCount / Math.max(1, (analytics.passCount + analytics.failCount))) * 100} 
                    className="h-full bg-destructive"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security / Integrity Monitor */}
        <Card className="border-none shadow-glass glass-card bg-destructive/[0.02]">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-muted-foreground/60">
               <ShieldCheck className="w-4 h-4 text-destructive" /> Security Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-10 space-y-6">
            <div className="relative">
               <div className="absolute inset-0 bg-destructive/20 blur-3xl rounded-full animate-pulse" />
               <div className="relative w-20 h-20 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center shadow-xl shadow-destructive/20">
                 <AlertTriangle className="w-8 h-8 text-destructive" />
               </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-semibold text-destructive mb-1">{analytics.flaggedPlagiarism}</div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Critical Security Violations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Performance Breakdown */}
      <Card className="border-none shadow-glass glass-card">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-lg font-semibold uppercase tracking-wider text-muted-foreground/60">Metric Granularity</CardTitle>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { label: "Final Score", value: analytics.averageScores.finalScore, icon: Award, color: "text-primary" },
              { label: "Accuracy", value: analytics.averageScores.accuracy, icon: TrendingUp, color: "text-blue-500" },
              { label: "Grammar", value: analytics.averageScores.grammar, icon: FileText, color: "text-emerald-500" },
              { label: "Typing Speed", value: analytics.averageScores.typingSpeed, icon: Zap, color: "text-orange-500" },
              { label: "Originality", value: analytics.averageScores.plagiarism, icon: ShieldCheck, color: "text-purple-500" }
            ].map((score, i) => (
              <div key={i} className="text-center p-5 glass-card border border-white/5 rounded-3xl hover:bg-white/[0.05] transition-colors group">
                <score.icon className={cn("w-6 h-6 mx-auto mb-3 transition-transform group-hover:scale-110", score.color)} />
                <div className="text-xl font-semibold mb-1">{score.value.toFixed(1)}%</div>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">{score.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Throughput Log */}
      <Card className="border-none shadow-glass glass-card">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
          <CardTitle className="text-lg font-semibold">Real-time Activity Log</CardTitle>
          <Badge variant="outline" className="rounded-full border-white/5 text-[9px] font-semibold uppercase tracking-widest px-3 py-1 bg-foreground/[0.03]">Monitoring Active</Badge>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {analytics.recentAttempts.map((attempt) => (
              <div 
                key={attempt.id} 
                className="flex items-center justify-between p-4 glass border border-white/5 rounded-2xl hover:bg-foreground/[0.03] transition-all group"
              >
                <div className="flex items-center gap-4">
                   <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/10 font-semibold text-primary text-xs">
                     {attempt.user.fullName[0]}
                   </div>
                   <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{attempt.user.fullName}</p>
                    <div className="flex items-center gap-1.5">
                       <p className="text-[10px] font-medium text-muted-foreground/60 uppercase">{attempt.exam.title}</p>
                       <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/30" />
                       <p className="text-[9px] font-medium text-muted-foreground/40 uppercase tracking-tighter">
                         {new Date(attempt.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                       </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {attempt.score && (
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-semibold leading-none">{attempt.score.finalScore.toFixed(0)}%</p>
                        <p className="text-[8px] font-medium text-muted-foreground/40 uppercase tracking-wider mt-1">Score</p>
                      </div>
                      <Badge variant={attempt.score.passed ? 'success' : 'destructive'} className="rounded-full px-2.5 py-0.5 font-semibold text-[8px] uppercase tracking-wider shadow-lg shadow-black/5">
                        {attempt.score.passed ? 'Passed' : 'Failed'}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
