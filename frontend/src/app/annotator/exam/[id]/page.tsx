"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useExamStore } from "@/store/examStore";
import { api } from "@/services/api";
import { formatTime } from "@/lib/utils";
import {
  Clock,
  AlertTriangle,
  Save,
  Send,
  ClipboardCopy,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Layers,
  Terminal,
  Activity,
  Zap,
  MousePointer2,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PageProps {
  params: {
    id: string; // The Attempt ID
  };
}

/**
 * Active Exam Session Component
 * Redesigned with a high-tech glassmorphism HUD and premium terminal aesthetic.
 */
export default function ActiveExamPage({ params }: PageProps) {
  const router = useRouter();
  const { toast } = useToast();

  const {
    currentExam,
    currentAttempt,
    answers,
    timeRemaining,
    isExamActive,
    pasteCount,
    hasHydrated,
    setCurrentExam,
    setCurrentAttempt,
    setAnswer,
    setTimeRemaining,
    setExamActive,
    incrementPasteCount,
    incrementTabSwitchCount,
    resetExam,
  } = useExamStore();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const questions = currentExam?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (!isExamActive || timeRemaining <= 0) return;

    intervalRef.current = setInterval(() => {
      setTimeRemaining(timeRemaining - 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeRemaining, isExamActive, setTimeRemaining]);

  useEffect(() => {
    if (timeRemaining === 0 && isExamActive) {
      handleSubmit();
    }
  }, [timeRemaining, isExamActive]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isExamActive) {
        incrementTabSwitchCount();
        toast({
          title: "Tab Switch Warning",
          description: "Warning: You have switched tabs. This is recorded.",
          variant: "destructive",
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isExamActive, incrementTabSwitchCount, toast]);

  useEffect(() => {
    const fetchAttemptData = async () => {
      if (!currentAttempt || currentAttempt.id !== params.id) {
        try {
          const response = await api.getAttemptDetails(params.id);
          setCurrentExam(response.attempt.exam);
          setCurrentAttempt(response.attempt);

          // Calculate remaining time based on start time and duration
          const startTime = new Date(response.attempt.createdAt).getTime();
          const durationSeconds = response.attempt.exam.duration * 60;
          const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
          setTimeRemaining(Math.max(0, durationSeconds - elapsedSeconds));
          setExamActive(true);
        } catch (err) {
          toast({
            title: "Session Recovery Failed",
            description: "Could not restore your exam progress.",
            variant: "destructive",
          });
        }
      }
    };

    fetchAttemptData();
  }, [
    params.id,
    currentAttempt,
    setCurrentExam,
    setCurrentAttempt,
    setTimeRemaining,
    setExamActive,
  ]);

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      e.preventDefault();
      incrementPasteCount();

      if (currentAttempt) {
        try {
          await api.trackPaste(currentAttempt.id);
        } catch (error) {
          console.error("Failed to track paste:", error);
        }
      }

      toast({
        title: "Paste Not Allowed",
        description: "Warning: Pasting is restricted for this exam.",
        variant: "destructive",
      });
    },
    [currentAttempt, incrementPasteCount, toast],
  );

  const saveAnswer = async () => {
    if (!currentAttempt || !currentQuestion) return;

    setIsSaving(true);
    try {
      const answer = answers[currentQuestion.id];
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const wpm = timeSpent > 0 ? Math.round((wordCount / timeSpent) * 60) : 0;

      await api.saveAnswer({
        attemptId: currentAttempt.id,
        questionId: currentQuestion.id,
        selectedOptionId: answer?.selectedOptionId || null,
        textAnswer: answer?.textAnswer || null,
        wordCount,
        timeSpent,
        wpm,
        pasteCount,
      });

      toast({
        title: "Progress Saved",
        description: "Your answer has been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Save Error",
        description: error.response?.data?.error || "Unable to save answer.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentAttempt || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await saveAnswer();
      const response = await api.submitAttempt(currentAttempt.id);
      resetExam();

      toast({
        title: "Exam Submitted",
        description: `Exam results submitted successfully. Final Score: ${response.score.finalScore.toFixed(1)}%`,
      });

      router.push("/annotator/results");
    } catch (error: any) {
      toast({
        title: "Submission Error",
        description: error.response?.data?.error || "Failed to submit exam.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOptionSelect = (optionId: string) => {
    setAnswer(currentQuestion.id, { selectedOptionId: optionId });
  };

  const handleTextInput = (text: string) => {
    const words = text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    setWordCount(words.length);
    setAnswer(currentQuestion.id, { textAnswer: text });
  };

  const goToNext = async () => {
    await saveAnswer();
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setStartTime(Date.now());
      setWordCount(0);
    }
  };

  const goToPrevious = async () => {
    await saveAnswer();
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setStartTime(Date.now());
      setWordCount(0);
    }
  };

  if (!hasHydrated || !currentExam || !currentAttempt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="p-8 rounded-[2rem] bg-orange-500/10 mb-8 border border-orange-500/20">
          <AlertTriangle className="h-16 w-16 text-orange-500" />
        </div>
        <h3 className="text-3xl font-semibold text-foreground uppercase">
          Exam Not Found
        </h3>
        <p className="text-muted-foreground mt-3 max-w-sm font-medium leading-relaxed">
          The session you are looking for does not exist or has expired.
        </p>
        <Button
          className="mt-10 rounded-full h-14 px-12 glass border-white/5 font-medium uppercase tracking-wider text-xs shadow-2xl shadow-primary/20"
          onClick={() => router.push("/annotator/exam")}
        >
          Go Back
        </Button>
      </div>
    );
  }

  const currentAnswer = answers[currentQuestion?.id];

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in duration-1000 pb-20 px-4">
      {/* HUD: Timer and Progress indicator (Sticky) */}
      <div className="sticky top-4 z-50 glass-card rounded-2xl border-none shadow-2xl shadow-black/20 p-3 backdrop-blur-3xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div
              className={cn(
                "flex flex-col items-center justify-center min-w-[120px] p-2 rounded-xl bg-foreground/[0.03] border border-white/5 transition-colors",
                timeRemaining < 300
                  ? "bg-destructive/10 border-destructive/20 animate-pulse"
                  : "",
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={cn("p-1.5 rounded-lg flex items-center justify-center", timeRemaining < 300 ? "bg-destructive/20" : "bg-primary/20")}>
                  <Clock
                    className={cn(
                      "w-3.5 h-3.5",
                      timeRemaining < 300 ? "text-destructive" : "text-primary",
                    )}
                  />
                </div>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Time Remaining
                </span>
              </div>
              <span
                className={cn(
                  "text-2xl font-semibold font-mono leading-none transition-colors",
                  timeRemaining < 300 ? "text-destructive" : "text-foreground",
                )}
              >
                {formatTime(timeRemaining)}
              </span>
            </div>

            <div className="hidden sm:block h-10 w-px bg-white/5" />

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="rounded-lg px-3 py-1 font-semibold text-[10px] uppercase tracking-wider border-none bg-primary/20 text-primary shadow-sm"
                >
                  Q {currentQuestionIndex + 1} / {questions.length}
                </Badge>
                {pasteCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="rounded-lg px-3 py-1 font-semibold text-[10px] uppercase tracking-wider border-none animate-pulse flex items-center shadow-sm"
                  >
                    <div className="p-1 bg-destructive-foreground/20 rounded-md mr-1.5">
                      <ClipboardCopy className="w-3 h-3" /> 
                    </div>
                    {pasteCount} Pasts
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                  <Activity className="w-3 h-3 text-emerald-500" />
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                  Monitor Active
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-full h-11 px-8 font-medium uppercase tracking-wider text-[10px] shadow-xl shadow-destructive/20 hover:scale-105 transition-transform"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5 mr-2" />
                Finish Exam
              </>
            )}
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 w-full bg-foreground/5 rounded-full h-1 overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary via-primary to-primary/40 h-full rounded-full transition-all duration-700 relative"
            style={{
              width: `${questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0}%`,
            }}
          >
            <div className="absolute top-0 right-0 h-full w-8 bg-white/40 blur-md animate-pulse" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Main Question Surface */}
        <div className="lg:col-span-9 space-y-4">
          <Card className="border-none shadow-glass glass-card group overflow-hidden transition-all duration-500 hover:shadow-primary/5">
            <div
              className={cn(
                "h-1 w-full bg-gradient-to-r transition-opacity duration-500",
                currentQuestion?.type === "MCQ"
                  ? "from-blue-500/50 to-blue-500/10"
                  : "from-purple-500/50 to-purple-500/10",
              )}
            />

            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="rounded-full px-4 py-1.5 glass border-white/5 font-semibold text-[10px] uppercase tracking-wider text-primary"
                  >
                    <Terminal className="w-3 h-3 mr-2" />
                    {currentQuestion  ?.type === "MCQ"
                      ? "Multiple Choice"
                      : "Subjective"}
                  </Badge>
                  <div className="flex items-center gap-2 text-muted-foreground/40 font-medium text-[10px] uppercase tracking-wider">
                    <Zap className="w-3 h-3" /> Points: {currentQuestion?.points}
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl font-semibold leading-tight text-foreground/90">
                  {currentQuestion?.content}
                </h3>
                {currentQuestion?.image && (
                  <div className="mt-2 rounded-2xl overflow-hidden border border-white/10 bg-foreground/[0.02] shadow-lg">
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-gradient-to-r from-primary/[0.06] to-transparent">
                      <div className="p-1 rounded-md bg-primary/20">
                        <ImageIcon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Reference Image - Study carefully before answering</span>
                    </div>
                    <div className="p-4 bg-foreground/[0.01]">
                      <img 
                        src={currentQuestion.image}
                        alt="Reference image for this question"
                        className="w-full max-h-[600px] object-contain rounded-xl cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                        onClick={() => window.open(currentQuestion.image, '_blank')}
                      />
                    </div>
                    <div className="px-4 py-2 border-t border-white/5 bg-foreground/[0.02]">
                      <p className="text-[9px] font-medium text-muted-foreground/30 text-center uppercase tracking-widest">
                        Click image to open full size in new tab
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* MCQ UI: Interactive listing of options */}
              {currentQuestion?.type === "MCQ" && currentQuestion?.options && (
                <div className="grid grid-cols-1 gap-3">
                  {currentQuestion?.options.map((option, idx) => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(option.id)}
                      className={cn(
                        "group/opt relative w-full text-left p-4 rounded-xl border transition-all duration-300",
                        currentAnswer?.selectedOptionId === option.id
                          ? "bg-primary/10 border-primary/40 shadow-sm shadow-primary/5"
                          : "bg-foreground/[0.02] border-white/5 hover:bg-foreground/[0.04] hover:border-white/10",
                      )}
                    >
                      <div className="flex items-center gap-5">
                        <div
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-xl font-semibold text-sm transition-all",
                            currentAnswer?.selectedOptionId === option.id
                              ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110"
                              : "bg-foreground/5 text-muted-foreground/40 group-hover/opt:bg-foreground/10",
                          )}
                        >
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span
                          className={cn(
                            "font-medium text-base transition-colors",
                            currentAnswer?.selectedOptionId === option.id
                              ? "text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {option.content}
                        </span>
                        {option.imageUrl && (
                          <img 
                            src={option.imageUrl}
                            alt="Option image"
                            className="mr-3 max-h-16 rounded-lg border border-white/5"
                          />
                        )}
                        {currentAnswer?.selectedOptionId === option.id && (
                          <CheckCircle2 className="ml-auto w-5 h-5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Subjective UI: Rich text area for long-form answers */}
              {currentQuestion?.type === "SUBJECTIVE" && (
                <div className="space-y-4">
                  <div className="relative group/text">
                    <div className="absolute inset-0 bg-primary/5 blur-xl group-focus-within/text:bg-primary/10 transition-all rounded-[1rem]" />
                    <textarea
                      ref={textareaRef}
                      className="relative w-full h-64 p-5 bg-foreground/[0.03] border border-white/5 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-foreground/[0.05] transition-all font-medium text-base leading-relaxed placeholder:text-muted-foreground/20"
                      placeholder="Type your answer here..."
                      value={currentAnswer?.textAnswer || ""}
                      onChange={(e) => handleTextInput(e.target.value)}
                      onPaste={handlePaste}
                    />
                  </div>

                  {/* Real-time metrics display */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-foreground/[0.03] border border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">
                        Word Count
                      </span>
                      <span className="font-medium text-sm">
                        {wordCount} Words
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-foreground/[0.03] border border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">
                        WPM
                      </span>
                      <span className="font-medium text-sm">
                        {wordCount > 0
                          ? Math.round(
                              (wordCount /
                                Math.max(
                                  1,
                                  Math.floor((Date.now() - startTime) / 1000),
                                )) *
                                60,
                            )
                          : 0}{" "}
                        WPM
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Toolbar: Navigation and Save actions */}
              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <Button
                  variant="ghost"
                  onClick={goToPrevious}
                  disabled={currentQuestionIndex === 0 || isSaving}
                  className="rounded-xl h-11 px-5 font-semibold text-muted-foreground hover:text-foreground hover:bg-foreground/5 "
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Back
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={saveAnswer}
                    disabled={isSaving}
                    className={cn(
                      "h-12 w-12 rounded-2xl glass border-white/5 transition-all active:scale-95",
                      isSaving
                        ? "text-primary animate-pulse"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/5",
                    )}
                  >
                    {isSaving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                  </Button>

                  {currentQuestionIndex < questions.length - 1 ? (
                    <Button
                      onClick={goToNext}
                      disabled={isSaving}
                      className="rounded-full h-12 px-8 font-medium uppercase tracking-wider text-[10px] shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                    >
                      Next Question <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="rounded-full h-12 px-8 font-medium uppercase tracking-wider text-[10px] shadow-xl shadow-primary/30 hover:scale-105 transition-transform"
                    >
                      Submit Exam <Send className="ml-2 w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel: Grid Navigator and Instructions */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-none shadow-glass glass-card">
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-primary" /> Questions
                </h4>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full bg-primary"
                    title="In Progress"
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-emerald-500"
                    title="Completed"
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-foreground/10"
                    title="Pending"
                  />
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2.5">
                {questions.map((q, index) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={cn(
                      "w-full aspect-square rounded-xl text-xs font-semibold transition-all flex items-center justify-center border",
                      index === currentQuestionIndex
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-110 z-10"
                        : answers[q.id]
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : "bg-foreground/[0.03] text-muted-foreground/40 border-white/5 hover:bg-foreground/[0.06]",
                    )}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-glass glass-card p-6 bg-gradient-to-br from-primary/[0.03] to-transparent">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-primary/40 rounded-full" />
                <h4 className="text-sm font-semibold uppercase tracking-wider">
                  Rules
                </h4>
              </div>
              <div className="space-y-4">
                <InfoItem icon={MousePointer2} text="Stay on this page" />
                <InfoItem icon={ShieldCheck} text="Tab switching is tracked" />
                <InfoItem icon={ClipboardCopy} text="Pasting is disabled" />
              </div>
              <div className="pt-4 mt-4 border-t border-white/5">
                <p className="text-[10px] font-semibold text-muted-foreground/30 uppercase leading-relaxed">
                  Your activity during the exam is monitored.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-1.5 rounded-lg bg-foreground/5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground/60" />
      </div>
      <span className="text-xs font-medium text-muted-foreground/60">
        {text}
      </span>
    </div>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
