"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useExamStore } from "@/store/examStore";
import { api } from "@/services/api";
import { Exam } from "@/types";
import {
  Clock,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity,
  Target,
} from "lucide-react";

/**
 * Exam Listing Page Component
 * Redesigned with glassmorphism and theme support.
 */
export default function ExamPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startingExam, setStartingExam] = useState<string | null>(null);

  const router = useRouter();
  const { toast } = useToast();
  const { setCurrentExam, setCurrentAttempt, setTimeRemaining, setExamActive } =
    useExamStore();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await api.getExams();
      setExams(response.exams);
    } catch (error: any) {
      toast({
        title: "Communication Protocol Error",
        description:
          error.response?.data?.error ||
          "Unable to synchronize available manifests.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startExam = async (exam: Exam) => {
    setStartingExam(exam.id);
    try {
      const response = await api.startAttempt(exam.id);

      // Set store data and redirect
      setCurrentExam(response.attempt.exam);
      setCurrentAttempt(response.attempt);
      setTimeRemaining(response.attempt.exam.duration * 60);
      setExamActive(true);

      toast({
        title: "Session Initialized",
        description:
          "Atmospheric stabilization complete. Good luck, Operative.",
      });

      router.push(`/annotator/exam/${response.attempt.id}`);
    } catch (error: any) {
      // Check if the error is because a session already exists
      if (
        error.response?.status === 400 &&
        error.response?.data?.attemptId
      ) {
        toast({
          title: "Active Session Found",
          description: "Resuming your existing evaluation session...",
        });
        router.push(`/annotator/exam/${error.response.data.attemptId}`);
      }
      toast({
        title: "Initialization Failed",
        description:
          error.response?.data?.error ||
          "Secure session could not be established.",
        variant: "destructive",
      });
    } finally {
      setStartingExam(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground animate-pulse">
          Loading exams...
        </p>
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="p-6 rounded-full bg-foreground/[0.03] border border-white/5 mb-6">
          <Zap className="h-12 w-12 text-muted-foreground/30" />
        </div>
        <h3 className="text-2xl font-semibold text-foreground">
          No exams found
        </h3>
        <p className="text-muted-foreground mt-2 max-w-xs font-medium">
          Platform registry is currently empty. Please check back later.
        </p>
        <Button
          variant="outline"
          className="mt-8 rounded-full h-11 px-8 glass border-white/5 font-medium"
          onClick={fetchExams}
        >
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-semibold text-foreground">
          Available Exams
        </h2>
        <p className="text-muted-foreground flex items-center gap-2 font-medium">
          <ShieldCheck className="w-4 h-4 text-primary" /> Select an exam to
          begin your assessment
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {exams.map((exam) => (
          <Card
            key={exam.id}
            className="group border-none shadow-glass glass-card flex flex-col hover:scale-[1.02] transition-all duration-300 overflow-hidden"
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-primary/50 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />

            <CardHeader className="pb-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <CardTitle className="text-xl font-semibold leading-tight group-hover:text-primary transition-colors">
                  {exam.title}
                </CardTitle>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full glass border-white/5 text-primary">
                  <Clock className="w-3.5 h-3.5 stroke-[2px]" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    {exam.duration}m
                  </span>
                </div>
              </div>
              {exam.description && (
                <p className="text-xs font-medium text-muted-foreground/60 line-clamp-2 leading-relaxed">
                  {exam.description}
                </p>
              )}
            </CardHeader>

            <CardContent className="flex-1 flex flex-col pt-0 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-2xl bg-foreground/[0.03] border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground/40">
                    <Target className="w-3 h-3" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider">
                      Mark
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {exam.passMark}% Required
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-foreground/[0.03] border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground/40">
                    <Activity className="w-3 h-3" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider">
                      Quota
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {exam.maxAttempts} Attempts
                  </p>
                </div>
              </div>

              <Button
                className="w-full h-12 rounded-2xl font-medium text-xs uppercase tracking-wider shadow-xl shadow-primary/20 group-hover:shadow-primary/30 transition-all active:scale-95"
                onClick={() => startExam(exam)}
                disabled={startingExam === exam.id}
              >
                {startingExam === exam.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                    Starting...
                  </>
                ) : (
                  <>
                    Start Exam
                    <ChevronRight className="ml-2 w-4 h-4 stroke-[2px] group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
