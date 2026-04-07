/**
 * @file CreateExam.tsx
 * @description Administrative interface for architecting new assessments.
 * Simple, minimalist design focused on functional clarity.
 */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Clock, 
  Target, 
  Activity, 
  FileText,
  ChevronLeft,
  Settings,
  HelpCircle,
  MoreVertical,
  Zap,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Option = { content: string; isCorrect: boolean };

type Question = { 
  content: string; 
  type: "MCQ" | "SUBJECTIVE"; 
  points: number; 
  options: Option[];
  subjectiveAnswer?: string; 
};

/**
 * Admin component for creating new exams.
 * Simple and minimalist redesign.
 */
export default function CreateExam() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("60");
  const [passMark, setPassMark] = useState("80");
  const [maxAttempts, setMaxAttempts] = useState("3");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const addQuestion = () => {
    setQuestions([
      ...questions, 
      { content: "", type: "MCQ", points: 10, options: [], subjectiveAnswer: "" }
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push({ content: "", isCorrect: false });
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, field: keyof Option, value: any) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = { ...newQuestions[qIndex].options[oIndex], [field]: value };
    setQuestions(newQuestions);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== oIndex);
    setQuestions(newQuestions);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please specify a name for this assessment.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title,
        description,
        duration: parseInt(duration),
        passMark: parseFloat(passMark),
        maxAttempts: parseInt(maxAttempts),
        questions: questions.map((q, i) => {
          let mappedOptions = q.options.map((o, j) => ({ ...o, order: j + 1 }));
          if (q.type === "SUBJECTIVE" && q.subjectiveAnswer) {
            mappedOptions = [{ content: q.subjectiveAnswer, isCorrect: true, order: 1 }];
          }
          return {
            content: q.content,
            type: q.type,
            order: i + 1,
            points: q.points || 10,
            options: mappedOptions
          };
        })
      };
      await api.createExam(payload);
      toast({
        title: "Assessment Created",
        description: "The exam manifest has been successfully synchronized.",
      });
      router.push("/admin/exams");
    } catch (error) {
      toast({
        title: "Deployment Failed",
        description: "Could not persist the assessment manifest. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all"
            onClick={() => router.back()}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="space-y-0.5">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Create Assessment</h2>
            <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest flex items-center gap-1.5">
              <Settings className="w-3 h-3" /> Manifest Configuration
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="rounded-full glass h-9 border-white/5 font-medium text-xs px-5 transition-all"
            onClick={() => router.back()}
          >
            Discard
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="rounded-full h-9 font-medium text-xs px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            {isSaving ? "Saving..." : "Save Manifest"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Manifest Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="border-none shadow-glass glass-card overflow-hidden">
            <div className="h-1 w-full bg-primary/20" />
            <CardHeader className="pb-4">
               <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Primary Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Title</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. Reasoning Assessment" 
                  className="h-10 bg-background/50 border-white/5 rounded-xl font-medium px-4 text-sm focus-visible:ring-primary/20" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Description</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Define assessment parameters..." 
                  className="min-h-[100px] bg-background/50 border-white/5 rounded-xl font-medium p-4 resize-none text-sm focus-visible:ring-primary/20" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-1">Duration (Min)</Label>
                   <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="h-10 bg-background/50 border-white/5 rounded-xl font-medium text-sm text-center focus-visible:ring-primary/20" />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-1">Pass %</Label>
                   <Input type="number" value={passMark} onChange={(e) => setPassMark(e.target.value)} className="h-10 bg-background/50 border-white/5 rounded-xl font-medium text-sm text-center focus-visible:ring-primary/20" />
                 </div>
              </div>
              <div className="space-y-2">
                 <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 ml-1">Max Attempts</Label>
                 <Input type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} className="h-10 bg-background/50 border-white/5 rounded-xl font-medium text-sm text-center focus-visible:ring-primary/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                 <HelpCircle className="w-5 h-5 text-primary/60" /> Question Registry
              </h3>
              <Button onClick={addQuestion} size="sm" className="rounded-xl h-8 px-4 font-medium text-[10px] uppercase tracking-wider bg-primary/10 text-primary hover:bg-primary/20 border-none">
                 <Plus className="w-3 h-3 mr-1.5" /> Append Question
              </Button>
          </div>

          <div className="space-y-4">
            {questions.map((q, index) => (
              <Card key={index} className="border-none shadow-glass glass-card group hover:bg-white/[0.01] transition-all overflow-hidden border border-transparent hover:border-white/5">
                <div className={cn(
                  "h-1 w-full bg-gradient-to-r",
                  q.type === 'MCQ' ? "from-blue-500/40 to-blue-500/10" : "from-primary/40 to-primary/10"
                )} />
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                   <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg glass border border-white/5 font-bold text-[10px] text-primary shadow-sm">
                         {index + 1}
                      </div>
                      <Badge variant="outline" className="rounded-full border-white/5 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 bg-foreground/[0.03]">
                         {q.type}
                      </Badge>
                   </div>
                   <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all" onClick={() => removeQuestion(index)}>
                      <Trash2 className="w-4 h-4" />
                   </Button>
                </CardHeader>
                <CardContent className="space-y-6 pt-2">
                  <div className="space-y-4">
                    <Textarea 
                      value={q.content} 
                      onChange={(e) => updateQuestion(index, "content", e.target.value)} 
                      placeholder="Specify your question manifest here..." 
                      className="min-h-[80px] bg-background/50 border-white/5 rounded-xl p-4 font-medium text-sm resize-none focus-visible:ring-primary/20"
                    />
                    
                    <div className="flex items-center gap-4">
                       <div className="flex-1 space-y-1.5">
                          <Label className="text-[8px] font-bold text-muted-foreground/40 uppercase ml-1">Type</Label>
                          <Select value={q.type} onValueChange={(val) => updateQuestion(index, "type", val as any)}>
                            <SelectTrigger className="glass border-white/5 h-9 rounded-xl px-4 font-medium text-[10px] uppercase">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass border-white/10 p-1">
                              <SelectItem value="MCQ" className="rounded-lg h-9 text-[10px] uppercase">MCQ</SelectItem>
                              <SelectItem value="SUBJECTIVE" className="rounded-lg h-9 text-[10px] uppercase">Subjective</SelectItem>
                            </SelectContent>
                          </Select>
                       </div>
                       <div className="w-32 space-y-1.5">
                          <Label className="text-[8px] font-bold text-muted-foreground/40 uppercase ml-1">Points</Label>
                          <Input type="number" value={q.points} onChange={(e) => updateQuestion(index, "points", parseInt(e.target.value))} className="h-9 bg-background/50 border-white/5 rounded-xl font-medium text-[10px] text-center" />
                       </div>
                    </div>
                  </div>

                  {q.type === "MCQ" ? (
                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between">
                           <Label className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Options</Label>
                           <Button variant="ghost" size="sm" onClick={() => addOption(index)} className="h-7 rounded-lg text-primary text-[9px] font-bold uppercase tracking-widest hover:bg-primary/5 px-3">
                             <Plus className="w-3 h-3 mr-1" /> Add Option
                           </Button>
                        </div>
                        <div className="grid gap-3">
                          {q.options.map((opt, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-3">
                               <input 
                                 type="radio" 
                                 name={`correct-${index}`} 
                                 checked={opt.isCorrect}
                                 onChange={() => {
                                   const newQuestions = [...questions];
                                   newQuestions[index].options.forEach(o => o.isCorrect = false);
                                   newQuestions[index].options[oIndex].isCorrect = true;
                                   setQuestions(newQuestions);
                                 }}
                                 className="w-4 h-4 accent-primary shrink-0 opacity-40 checked:opacity-100 transition-all"
                               />
                               <Input 
                                 value={opt.content} 
                                 onChange={(e) => updateOption(index, oIndex, "content", e.target.value)} 
                                 placeholder="Option specification..."
                                 className={cn(
                                   "h-9 bg-background/50 border-white/5 rounded-xl px-4 text-xs font-medium focus-visible:ring-primary/20",
                                   opt.isCorrect && "border-primary/20 bg-primary/5"
                                 )}
                               />
                               <Button variant="ghost" size="icon" onClick={() => removeOption(index, oIndex)} className="h-8 w-8 text-muted-foreground/20 hover:text-destructive hover:bg-destructive/5 rounded-lg">
                                 <Trash2 className="w-3.5 h-3.5" />
                               </Button>
                            </div>
                          ))}
                        </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-4 border-t border-white/5">
                       <Label className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Grading Blueprint</Label>
                       <Textarea 
                        value={q.subjectiveAnswer || ""} 
                        onChange={(e) => updateQuestion(index, "subjectiveAnswer", e.target.value)} 
                        placeholder="Model answer for verification..."
                        className="min-h-[100px] bg-background/50 border-white/5 rounded-xl p-4 font-medium text-xs focus-visible:ring-primary/20 resize-none"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {questions.length === 0 && (
              <div className="py-20 text-center glass-card rounded-3xl border border-dashed border-white/10 bg-foreground/[0.01]">
                <FileText className="w-10 h-10 text-muted-foreground/10 mx-auto mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/30">Registry Manifest Empty</p>
                <Button onClick={addQuestion} variant="ghost" className="mt-4 text-[10px] font-bold uppercase text-primary hover:bg-primary/5 rounded-xl px-6">
                   Initialize First Question
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ className, variant, ...props }: any) {
  return (
    <div className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      variant === "outline" ? "text-foreground" : "bg-primary text-primary-foreground",
      className
    )} {...props} />
  );
}
