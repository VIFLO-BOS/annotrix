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

type Option = { content: string; isCorrect: boolean; imageUrl?: string };

type Question = { 
  content: string; 
  type: "MCQ" | "SUBJECTIVE"; 
  points: number; 
  options: Option[];
  subjectiveAnswer?: string; 
  imageUrl?: string;
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
            imageUrl: q.imageUrl,
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
    <div className="mx-auto space-y-6 animate-in fade-in duration-500 pb-8">
      {/* Header Section */}
      <div className="flex items-center justify-between bg-card py-1 px-2" >
        <div className="flex items-center gap-3">
          <div className="space-y-0.5">
            <h2 className="text-xl font-semibold text-foreground">Create Assessment</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Settings className="w-3 h-3" /> Configuration
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="h-9 px-4 text-sm rounded-lg"
            onClick={() => router.back()}
          >
            Discard
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="h-9 px-4 text-sm rounded-lg"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Settings Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="glass-card overflow-hidden">
            <div className="h-1 w-full bg-primary/20" />
            <CardHeader className="px-4 pt-4 pb-2">
               <CardTitle className="text-xs font-medium text-muted-foreground">Primary Settings</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs text-muted-foreground">Title</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. Reasoning Assessment" 
                  className="h-9 rounded-lg text-sm" 
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs text-muted-foreground">Description</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Define assessment parameters..." 
                  className="min-h-[80px] rounded-lg text-sm resize-none" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1.5">
                   <Label className="text-xs text-muted-foreground">Duration (Min)</Label>
                   <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="h-9 rounded-lg text-sm text-center" />
                 </div>
                 <div className="space-y-1.5">
                   <Label className="text-xs text-muted-foreground">Pass %</Label>
                   <Input type="number" value={passMark} onChange={(e) => setPassMark(e.target.value)} className="h-9 rounded-lg text-sm text-center" />
                 </div>
              </div>
              <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground">Max Attempts</Label>
                 <Input type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} className="h-9 rounded-lg text-sm text-center" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                 <HelpCircle className="w-4 h-4 text-primary" /> Questions
              </h3>
              <Button onClick={addQuestion} size="sm" variant="outline" className="h-8 px-3 text-xs rounded-lg">
                 <Plus className="w-3 h-3 mr-1.5" /> Add Question
              </Button>
          </div>

          <div className="space-y-3">
            {questions.map((q, index) => (
              <Card key={index} className="glass-card overflow-hidden">
                <div className={cn(
                  "h-1 w-full",
                  q.type === 'MCQ' ? "bg-blue-500/40" : "bg-primary/40"
                )} />
                <CardHeader className="flex flex-row items-center justify-between px-4 py-3">
                   <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-md bg-muted text-xs font-medium text-muted-foreground">
                         {index + 1}
                      </div>
                      <span className="text-xs text-muted-foreground border border-border rounded-md px-2 py-0.5">
                         {q.type}
                      </span>
                   </div>
                   <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-md" onClick={() => removeQuestion(index)}>
                      <Trash2 className="w-3.5 h-3.5" />
                   </Button>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-4">
                  <div className="space-y-3">
                    <Textarea 
                      value={q.content} 
                      onChange={(e) => updateQuestion(index, "content", e.target.value)} 
                      placeholder="Enter your question..." 
                      className="min-h-[80px] rounded-lg text-sm resize-none"
                    />
                    
                    <div className="flex items-center gap-3">
                       <div className="flex-1 space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Type</Label>
                          <Select value={q.type} onValueChange={(val) => updateQuestion(index, "type", val as any)}>
                            <SelectTrigger className="h-9 rounded-lg text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
                              <SelectItem value="MCQ" className="rounded-md text-sm">MCQ</SelectItem>
                              <SelectItem value="SUBJECTIVE" className="rounded-md text-sm">Subjective</SelectItem>
                            </SelectContent>
                          </Select>
                       </div>
                       <div className="w-24 space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Points</Label>
                          <Input type="number" value={q.points} onChange={(e) => updateQuestion(index, "points", parseInt(e.target.value))} className="h-9 rounded-lg text-sm text-center" />
                       </div>
                       <div className="w-32 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Image</Label>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden"
                          id={`q-img-${index}`}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            // Optimistically preview the local image file immediately!
                            const previewUrl = URL.createObjectURL(file);
                            updateQuestion(index, "imageUrl", previewUrl);

                            try {
                              const result = await api.uploadImage(file);
                              updateQuestion(index, "imageUrl", result.url);
                              toast({ title: "Image Uploaded" });
                            } catch {
                              toast({ title: "Upload Failed", variant: "destructive" });
                            }
                          }}
                        />
                        <div className="space-y-2 w-full">
                          {q.imageUrl && (
                             <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border">
                               <img src={q.imageUrl} alt="Question Asset" className="w-full h-full object-contain" />
                             </div>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-full text-xs rounded-lg"
                            onClick={() => document.getElementById(`q-img-${index}`)?.click()}
                          >
                            {q.imageUrl ? "Replace" : "Upload"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {q.type === "MCQ" ? (
                    <div className="space-y-3 pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                           <Label className="text-xs text-muted-foreground">Options</Label>
                           <Button variant="ghost" size="sm" onClick={() => addOption(index)} className="h-7 rounded-md text-primary text-xs hover:bg-primary/5 px-2">
                             <Plus className="w-3 h-3 mr-1" /> Add
                           </Button>
                        </div>
                        <div className="grid gap-2">
                          {q.options.map((opt, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-2">
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
                                 className="w-4 h-4 accent-primary shrink-0"
                               />
                               <Input 
                                 value={opt.content} 
                                 onChange={(e) => updateOption(index, oIndex, "content", e.target.value)} 
                                 placeholder="Option text..."
                                 className={cn(
                                   "h-9 rounded-lg text-sm",
                                   opt.isCorrect && "border-primary/30 bg-primary/5"
                                 )}
                               />
                               <Button variant="ghost" size="icon" onClick={() => removeOption(index, oIndex)} className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-md">
                                 <Trash2 className="w-3.5 h-3.5" />
                               </Button>
                            </div>
                          ))}
                        </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 pt-4 border-t border-border">
                       <Label className="text-xs text-muted-foreground">Model Answer</Label>
                       <Textarea 
                        value={q.subjectiveAnswer || ""} 
                        onChange={(e) => updateQuestion(index, "subjectiveAnswer", e.target.value)} 
                        placeholder="Model answer for verification..."
                        className="min-h-[80px] rounded-lg text-sm resize-none"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {questions.length === 0 && (
              <div className="py-16 text-center rounded-lg border border-dashed border-border">
                <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No questions added yet</p>
                <Button onClick={addQuestion} variant="ghost" className="mt-3 text-sm text-primary hover:bg-primary/5 rounded-lg px-4">
                   Add First Question
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
