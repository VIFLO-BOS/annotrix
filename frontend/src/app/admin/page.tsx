'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Award,
  Clock,
  Layout, 
  Search, 
  Filter, 
  History 
} from 'lucide-react';

/**
 * Interface representing the structure of platform analytics.
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
 * Admin Dashboard Component
 * Redesigned with glassmorphism and theme support.
 */
export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.getAnalytics();
      setAnalytics(response.analytics);
    } catch (error: any) {
      toast({
        title: 'Error Rendering Analytics',
        description: error.response?.data?.error || 'System failed to load platform data.',
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
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground animate-pulse">Loading Dashboard</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="p-6 rounded-full bg-destructive/10 mb-6">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        <h3 className="text-2xl font-bold tracking-tight">No results found</h3>
        <p className="text-muted-foreground mt-2 max-w-xs">We encountered an issue retrieving real-time platform analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-semibold text-foreground">
            Admin Dashboard
          </h2>
          <p className="text-muted-foreground flex items-center gap-2 font-medium">
            <Layout className="w-4 h-4" /> View platform analytics and system performance
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="rounded-full glass h-10 px-5 border-white/5 font-medium text-xs">
             <Filter className="w-3.5 h-3.5 mr-2" /> Filter Data
           </Button>
           <Button 
             className="rounded-full h-10 px-6 font-medium shadow-lg shadow-primary/20 text-xs"
             onClick={() => {
               toast({
                 title: "Export Initiated",
                 description: "Synchronizing platform data for PDF generation...",
               });
             }}
           >
             Export Report
           </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Users", value: analytics.totalUsers, sub: `${analytics.disqualifiedCount} restricted`, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Active Exams", value: analytics.totalExams, sub: "Published versions", icon: FileText, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Total Attempts", value: analytics.totalAttempts, sub: "Last 30 days", icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
          { label: "Pass Rate", value: `${analytics.passRate.toFixed(1)}%`, sub: "Global Average", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10", progress: analytics.passRate }
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

      {/* Middle Grid: Integrity and Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-glass glass-card">
          <CardHeader className="border-b border-white/5 pb-6">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-primary" /> Pass/Fail Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-emerald-500/10">
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">{analytics.passCount}</p>
                    <p className="text-[10px] font-medium text-muted-foreground/60 uppercase">Successful Completions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-emerald-500">{((analytics.passCount / Math.max(1, analytics.totalAttempts)) * 100).toFixed(0)}%</p>
                </div>
              </div>

              <div className="h-4 w-full bg-destructive/10 rounded-full overflow-hidden relative">
                <div 
                  className="absolute left-0 top-0 h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-1000"
                  style={{ width: `${(analytics.passCount / Math.max(1, (analytics.passCount + analytics.failCount))) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-destructive/10">
                    <XCircle className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">{analytics.failCount}</p>
                    <p className="text-[10px] font-medium text-muted-foreground/60 uppercase">Unsuccessful Attempts</p>
                  </div>
                </div>
                 <div className="text-right">
                  <p className="text-xl font-semibold text-destructive">{((analytics.failCount / Math.max(1, analytics.totalAttempts)) * 100).toFixed(0)}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security / Integrity Monitoring Card */}
        <Card className="border-none shadow-glass glass-card bg-destructive/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
               <AlertTriangle className="w-4 h-4 text-destructive" /> Security Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8 space-y-5">
            <div className="relative">
               <div className="absolute inset-0 bg-destructive/20 blur-3xl rounded-full animate-pulse" />
               <div className="relative w-20 h-20 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center shadow-xl shadow-destructive/20">
                 <AlertTriangle className="w-8 h-8 text-destructive" />
               </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-semibold text-destructive mb-1">{analytics.flaggedPlagiarism}</div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Plagiarism Incidents</p>
            </div>
            <Button 
              variant="destructive" 
              className="w-full rounded-xl font-medium h-10 text-xs"
              onClick={() => router.push('/admin/flagged-sessions')}
            >
              Review Flagged Sessions
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Average Scores */}
      <Card className="border-none shadow-glass glass-card">
        <CardHeader className="border-b border-white/5 pb-3">
          <CardTitle className="text-lg font-semibold uppercase tracking-wider text-muted-foreground/60">Average Scores</CardTitle>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { label: "Final Score", value: analytics.averageScores.finalScore, icon: Award, color: "text-primary" },
              { label: "Accuracy", value: analytics.averageScores.accuracy, icon: TrendingUp, color: "text-blue-500" },
              { label: "Grammar", value: analytics.averageScores.grammar, icon: FileText, color: "text-emerald-500" },
              { label: "Typing Speed", value: analytics.averageScores.typingSpeed, icon: Clock, color: "text-orange-500" },
              { label: "Originality", value: analytics.averageScores.plagiarism, icon: AlertTriangle, color: "text-purple-500" }
            ].map((score, i) => (
              <div key={i} className="text-center p-5 glass-card border border-white/5 rounded-3xl hover:bg-foreground/[0.02] transition-colors group">
                <score.icon className={cn("w-6 h-6 mx-auto mb-3 transition-transform group-hover:scale-110", score.color)} />
                <div className="text-xl font-semibold mb-1">{score.value.toFixed(1)}%</div>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">{score.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card className="border-none shadow-glass glass-card">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
          <CardTitle className="text-lg font-semibold">Recent Attempts</CardTitle>
          <Button 
            variant="ghost" 
            className="text-[10px] font-medium text-primary hover:bg-primary/10 px-3 h-8"
            onClick={() => router.push('/admin/audit-logs')}
          >
            View Audit Log
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {analytics.recentAttempts.map((attempt) => (
              <div 
                key={attempt.id} 
                className="flex items-center justify-between p-5 glass border border-white/5 rounded-2xl hover:bg-foreground/[0.03] transition-all group"
              >
                <div className="flex items-center gap-5">
                   <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/10 font-semibold text-primary text-sm">
                     {attempt.user.fullName[0]}
                   </div>
                   <div>
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{attempt.user.fullName}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <p className="text-xs font-medium text-muted-foreground">{attempt.exam.title}</p>
                       <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                       <p className="text-[10px] font-medium text-muted-foreground/40 uppercase">
                         {new Date(attempt.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                       </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  {attempt.score && (
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-semibold leading-none">{attempt.score.finalScore.toFixed(0)}%</p>
                        <p className="text-[9px] font-medium text-muted-foreground/40 uppercase tracking-wider mt-1">Score</p>
                      </div>
                      <Badge variant={attempt.score.passed ? 'success' : 'destructive'} className="rounded-full px-3 py-1 font-semibold text-[8px] uppercase tracking-wider shadow-lg shadow-black/5">
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

