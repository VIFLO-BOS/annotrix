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
    userId: string;
    examId: string;
    user: { fullName: string; email: string };
    exam: { title: string };
    scores: Array<{ finalScore: number; passed: boolean }>;
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
  const [isApproving, setIsApproving] = useState<string | null>(null);
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

  const approveRetake = async (userId: string, examId: string, attemptId: string) => {
    setIsApproving(attemptId);
    try {
      await api.approveRetake(userId, examId);
      toast({
        title: 'Retake Approved',
        description: 'The user has been granted permission to retake this exam.',
      });
    } catch (error: any) {
      toast({
        title: 'Approval Failed',
        description: error.response?.data?.error || 'Could not approve retake.',
        variant: 'destructive',
      });
    } finally {
      setIsApproving(null);
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">
            Admin Dashboard
          </h2>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Layout className="w-4 h-4" /> Platform analytics and system performance
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="h-9 px-4 text-sm rounded-lg">
             <Filter className="w-3.5 h-3.5 mr-2" /> Filter
           </Button>
           <Button 
             className="h-9 px-4 text-sm rounded-lg"
             onClick={async () => {
               try {
                 const blob = await api.exportQualifiedUsers();
                 const url = window.URL.createObjectURL(new Blob([blob]));
                 const link = document.createElement('a');
                 link.href = url;
                 link.download = 'qualified-users.xlsx';
                 link.click();
                 window.URL.revokeObjectURL(url);
                 toast({ title: "Export Complete", description: "Qualified users file downloaded." });
               } catch (error) {
                 toast({ title: "Export Failed", description: "Could not download the report.", variant: "destructive" });
               }
             }}
           >
             Export Report
           </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: analytics.totalUsers, sub: `${analytics.disqualifiedCount} restricted`, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Active Exams", value: analytics.totalExams, sub: "Published versions", icon: FileText, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Total Attempts", value: analytics.totalAttempts, sub: "All time", icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
          { label: "Pass Rate", value: `${analytics.passRate.toFixed(1)}%`, sub: "Global average", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10", progress: analytics.passRate }
        ].map((stat, i) => (
          <Card key={i} className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{stat.label}</CardTitle>
              <div className={cn("p-1.5 rounded-lg", stat.bg)}>
                <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-semibold tracking-tight">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
              {stat.progress !== undefined && (
                <div className="mt-3 h-1 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-1000" 
                    style={{ width: `${stat.progress}%` }} 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Middle Grid: Integrity and Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 glass-card">
          <CardHeader className="border-b border-border px-4 py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <History className="w-4 h-4 text-primary" /> Pass/Fail Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{analytics.passCount}</p>
                    <p className="text-xs text-muted-foreground">Successful completions</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-emerald-500">{((analytics.passCount / Math.max(1, analytics.totalAttempts)) * 100).toFixed(0)}%</p>
              </div>

              <div className="h-2 w-full bg-muted rounded-full overflow-hidden relative">
                <div 
                  className="absolute left-0 top-0 h-full bg-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: `${(analytics.passCount / Math.max(1, (analytics.passCount + analytics.failCount))) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <XCircle className="w-4 h-4 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{analytics.failCount}</p>
                    <p className="text-xs text-muted-foreground">Unsuccessful attempts</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-destructive">{((analytics.failCount / Math.max(1, analytics.totalAttempts)) * 100).toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security / Integrity Monitoring Card */}
        <Card className="glass-card">
          <CardHeader className="border-b border-border px-4 py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
               <AlertTriangle className="w-4 h-4 text-destructive" /> Security Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-destructive">{analytics.flaggedPlagiarism}</div>
              <p className="text-xs text-muted-foreground mt-1">Plagiarism incidents</p>
            </div>
            <Button 
              variant="destructive" 
              className="w-full rounded-lg h-9 text-sm"
              onClick={() => router.push('/admin/flagged-sessions')}
            >
              Review Flagged Sessions
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Average Scores */}
      <Card className="glass-card">
        <CardHeader className="border-b border-border px-4 py-3">
          <CardTitle className="text-sm font-medium">Average Scores</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Final Score", value: analytics.averageScores.finalScore, icon: Award, color: "text-primary", bg: "bg-primary/10" },
              { label: "Accuracy", value: analytics.averageScores.accuracy, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "Grammar", value: analytics.averageScores.grammar, icon: FileText, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { label: "Typing Speed", value: analytics.averageScores.typingSpeed, icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
              { label: "Originality", value: analytics.averageScores.plagiarism, icon: AlertTriangle, color: "text-purple-500", bg: "bg-purple-500/10" }
            ].map((score, i) => (
              <div key={i} className="text-center p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div className={cn("w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center", score.bg)}>
                  <score.icon className={cn("w-4 h-4", score.color)} />
                </div>
                <div className="text-lg font-semibold">{score.value.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">{score.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
          <CardTitle className="text-sm font-medium">Recent Attempts</CardTitle>
          <Button 
            variant="ghost" 
            className="text-xs text-primary hover:bg-primary/10 px-3 h-8 rounded-lg"
            onClick={() => router.push('/admin/audit-logs')}
          >
            View Audit Log
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {analytics.recentAttempts.map((attempt) => (
              <div 
                key={attempt.id} 
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                   <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center font-medium text-primary text-sm">
                     {attempt.user.fullName[0]}
                   </div>
                   <div>
                    <p className="text-sm font-medium text-foreground">{attempt.user.fullName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                       <p className="text-xs text-muted-foreground">{attempt.exam.title}</p>
                       <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                       <p className="text-xs text-muted-foreground">
                         {new Date(attempt.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                       </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {attempt.scores?.length > 0 && (() => {
                    const score = attempt.scores[0];
                    return (
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-semibold leading-none">{score.finalScore.toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Score</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge variant={score.passed ? 'success' : 'destructive'} className="rounded-md px-2 py-0.5 text-xs">
                          {score.passed ? 'Passed' : 'Failed'}
                        </Badge>
                        {!score.passed && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-xs px-2 text-primary hover:bg-primary/10 rounded-md"
                            onClick={() => approveRetake(attempt.userId, attempt.examId, attempt.id)}
                            disabled={isApproving === attempt.id}
                          >
                            {isApproving === attempt.id ? 'Approving...' : 'Approve Retake'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

