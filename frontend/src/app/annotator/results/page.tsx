"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { Score } from '@/types';
import { 
  Award, 
  CheckCircle, 
  XCircle,
  Target,
  Zap,
  FileText,
  Activity,
  History,
  TrendingUp,
  ShieldCheck,
  MousePointer2
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Results Page Component
 * Redesigned with glassmorphism and theme support.
 */
export default function ResultsPage() {
  const [scores, setScores] = useState<Score[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      const response = await api.getMyScores();
      setScores(response.scores);
    } catch (error: any) {
      toast({
        title: 'Registry Sync Error',
        description: error.response?.data?.error || 'Unable to synchronize your historical performance records.',
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
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground animate-pulse">Loading results...</p>
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="p-8 rounded-[2rem] bg-foreground/[0.03] border border-white/5 mb-8">
          <History className="h-16 w-16 text-muted-foreground/30" />
        </div>
        <h3 className="text-3xl font-semibold text-foreground uppercase">No results found</h3>
        <p className="text-muted-foreground mt-3 max-w-sm font-medium leading-relaxed">You haven't taken any exams yet. Complete an exam to see your results.</p>
        <Button 
          className="mt-10 rounded-full h-14 px-12 glass border-white/5 font-medium uppercase tracking-wider text-xs shadow-2xl shadow-primary/20" 
          onClick={() => window.location.href = '/annotator/exam'}
        >
          Take Exam
        </Button>
      </div>
    );
  }

  const latestScore = scores[0];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-3xl font-semibold text-foreground">
          My Results
        </h2>
        <p className="text-muted-foreground flex items-center gap-2 font-medium">
          <Activity className="w-4 h-4 text-primary" /> View your exam scores and performance breakdown
        </p>
      </div>

      {/* Latest Score Overview: Detailed breakdown of the most recent attempt */}
      <Card className="border-none shadow-glass glass-card group overflow-hidden transition-all duration-500">
        <div className={cn(
          "h-1.5 w-full bg-gradient-to-r transition-opacity duration-500",
          latestScore.passed ? "from-emerald-500/80 to-emerald-500/10" : "from-destructive/80 to-destructive/10"
        )} />
        
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold uppercase leading-tight">Latest Result</CardTitle>
              <p className="text-[10px] font-medium text-muted-foreground/60 flex items-center gap-1.5">
                <Target className="w-3 h-3" />
                Exam: {latestScore.attempt?.exam?.title || 'Tactical Assessment'}
              </p>
            </div>
            <Badge 
              variant={latestScore.passed ? 'success' : 'destructive'}
              className="rounded-full px-5 py-1.5 font-semibold text-xs uppercase tracking-wider border-none shrink-0"
            >
              {latestScore.passed ? (
                <><CheckCircle className="w-4 h-4 mr-2" /> Passed</>
              ) : (
                <><XCircle className="w-4 h-4 mr-2" /> Failed</>
              )}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 pb-10">
          <div className="flex flex-col items-center justify-center py-6 relative">
             <div className="absolute inset-0 flex items-center justify-center blur-3xl opacity-20">
                <div className={cn(
                   "w-32 h-32 rounded-full transition-colors",
                   latestScore.passed ? "bg-emerald-500" : "bg-destructive"
                )} />
             </div>
             <div className="relative text-center">
              <div className="text-[5rem] sm:text-[6rem] font-semibold leading-none text-foreground select-none">
                {latestScore.finalScore.toFixed(0)}%
              </div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/40 mt-1">Final Score</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricBox 
              icon={Target} 
              label="Accuracy" 
              value={`${latestScore.accuracy.toFixed(1)}%`} 
              progress={latestScore.accuracy} 
              color="text-blue-500" 
              bg="bg-blue-500/10" 
            />
            <MetricBox 
              icon={FileText} 
              label="Grammar" 
              value={`${latestScore.grammar.toFixed(1)}%`} 
              progress={latestScore.grammar} 
              color="text-emerald-500" 
              bg="bg-emerald-500/10" 
            />
            <MetricBox 
              icon={Zap} 
              label="WPM" 
              value={`${latestScore.typingSpeed.toFixed(1)}%`} 
              progress={latestScore.typingSpeed} 
              color="text-orange-500" 
              bg="bg-orange-500/10" 
            />
            <MetricBox 
              icon={Award} 
              label="Integrity" 
              value={`${latestScore.plagiarism.toFixed(1)}%`} 
              progress={latestScore.plagiarism} 
              color="text-purple-500" 
              bg="bg-purple-500/10" 
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Score History Feed */}
        <Card className="lg:col-span-8 border-none shadow-glass glass-card">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-lg font-semibold uppercase flex items-center gap-2">
               <History className="w-4 h-4 text-primary" /> Exam History
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {scores.map((score, index) => (
                <div 
                  key={score.id} 
                  className="group/item flex items-center justify-between p-4 rounded-xl bg-foreground/[0.02] border border-white/5 hover:bg-foreground/[0.04] hover:border-white/10 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl glass border border-white/5 flex items-center justify-center transition-transform group-hover/item:scale-105">
                      <span className="text-[10px] font-bold text-primary">#{scores.length - index}</span>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-foreground leading-none">
                        {score.attempt?.exam?.title || 'Tactical Assessment'}
                      </p>
                      <p className="text-[9px] font-medium text-muted-foreground/40 uppercase tracking-wider">
                        {new Date(score.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-semibold leading-none">{score.finalScore.toFixed(0)}%</p>
                      <p className="text-[8px] font-medium text-muted-foreground/30 uppercase tracking-wider mt-1">Score</p>
                    </div>
                    <Badge variant={score.passed ? 'success' : 'destructive'} className="rounded-full px-2.5 py-0.5 font-semibold text-[8px] uppercase tracking-wider border-none">
                      {score.passed ? 'Passed' : 'Failed'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Evaluation Methodology Explanation */}
        <Card className="lg:col-span-4 border-none shadow-glass glass-card">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-lg font-semibold uppercase flex items-center gap-2">
               <TrendingUp className="w-4 h-4 text-primary" /> Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <MethodItem icon={Target} weight="40%" label="Accuracy" desc="MCQ precision and logic verification." color="bg-blue-500" />
            <MethodItem icon={FileText} weight="20%" label="Grammar" desc="Lexical complexity and syntax quality." color="bg-emerald-500" />
            <MethodItem icon={Zap} weight="20%" label="WPM" desc="Operational efficiency and keystroke cadence." color="bg-orange-500" />
            <MethodItem icon={ShieldCheck} weight="20%" label="Integrity" desc="Monitoring for external data intrusion." color="bg-purple-500" />
            
            <div className="pt-6 border-t border-white/5">
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MousePointer2 className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-[9px] font-medium text-primary/70 uppercase tracking-wider leading-relaxed">
                    Your final score is calculated based on these factors.
                  </p>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricBox({ icon: Icon, label, value, progress, color, bg }: { icon: any, label: string, value: string, progress: number, color: string, bg: string }) {
  return (
    <div className="p-4 rounded-2xl bg-foreground/[0.03] border border-white/5 space-y-3 group-hover:bg-foreground/[0.05] transition-colors">
      <div className="flex items-center justify-between">
        <div className={cn("p-1.5 rounded-lg", bg)}>
          <Icon className={cn("w-3.5 h-3.5", color)} />
        </div>
        <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground/40">{label}</span>
      </div>
      <div className="space-y-2">
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <div className="h-1 w-full bg-foreground/5 rounded-full overflow-hidden">
           <div 
             className={cn("h-full transition-all duration-1000", color.replace('text-', 'bg-'))} 
             style={{ width: `${progress}%` }} 
           />
        </div>
      </div>
    </div>
  );
}

function MethodItem({ icon: Icon, weight, label, desc, color }: { icon: any, weight: string, label: string, desc: string, color: string }) {
  return (
    <div className="flex gap-3 group/method">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover/method:scale-105", color, "bg-opacity-10")}>
        <Icon className={cn("w-4 h-4", color.replace('bg-', 'text-'))} />
      </div>
      <div className="space-y-0.5">
        <div className="flex items-center justify-between">
           <h4 className="text-[11px] font-semibold uppercase">{label}</h4>
           <span className="text-[9px] font-semibold text-primary p-0.5 px-1.5 rounded bg-primary/5 line-none">{weight}</span>
        </div>
        <p className="text-[9px] font-medium text-muted-foreground/60 leading-relaxed line-clamp-2">{desc}</p>
      </div>
    </div>
  );
}

