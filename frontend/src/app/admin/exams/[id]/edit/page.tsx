/**
 * @file page.tsx
 * @description The assessment manifest editor for administrators.
 * Provides a formal interface for modifying metadata (title, pass mark, 
 * duration) and proctoring parameters for existing exams.
 * Includes image management for exam questions.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { Exam, Question } from '@/types';
import { 
  ChevronLeft, 
  Save, 
  Trash2, 
  History, 
  Settings, 
  ShieldCheck,
  ClipboardList,
  AlertTriangle,
  Loader2,
  ImageIcon,
  Upload,
  X,
  ZoomIn
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Admin Edit Exam Page Component
 * Redesigned with glassmorphism and refined sizing.
 * Includes image management for question reference images.
 */
export default function AdminEditExamPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [exam, setExam] = useState<Exam | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 30,
    maxAttempts: 3,
    passMark: 70,
    isActive: true,
  });
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  useEffect(() => {
    fetchExam();
  }, [id]);

  /**
   * Fetches the current manifest data to populate the edit form.
   */
  const fetchExam = async () => {
    try {
      const response = await api.getExam(id);
      const examData = response.exam;
      setExam(examData);
      setFormData({
        title: examData.title,
        description: examData.description || '',
        duration: examData.duration,
        maxAttempts: examData.maxAttempts,
        passMark: examData.passMark,
        isActive: examData.isActive,
      });
    } catch (error: any) {
      toast({
        title: 'Registry Error',
        description: error.response?.data?.error || 'Unable to load manifest for editing.',
        variant: 'destructive',
      });
      router.push('/admin/exams');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles form submission and manifest synchronization with the backend.
   */
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    try {
      await api.updateExam(id, formData);
      toast({
        title: 'Manifest Synchronized',
        description: 'The assessment configuration has been updated successfully.',
      });
      router.push(`/admin/exams/${id}`);
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.response?.data?.error || 'Failed to persist manifest changes.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handles image upload for a specific question.
   */
  const handleImageUpload = async (questionId: string, file: File) => {
    setUploadingImage(questionId);
    try {
      const result = await api.uploadImage(file);
      // Update the question image via a dedicated endpoint or re-fetch
      // For now, we'll update the question image through a PATCH-like approach
      await api.updateQuestionImage(questionId, result.url);
      
      // Update local state
      if (exam) {
        setExam({
          ...exam,
          questions: exam.questions?.map(q => 
            q.id === questionId ? { ...q, image: result.url } : q
          ),
        });
      }
      
      toast({
        title: 'Image Updated',
        description: 'The reference image has been successfully replaced.',
      });
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.response?.data?.error || 'Could not upload the image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground animate-pulse">Syncing Manifest</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all"
            onClick={() => router.back()}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="space-y-0.5">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Edit Manifest</h2>
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1.5">
              <Settings className="w-3 h-3" /> System Configuration Repository
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="rounded-full glass h-9 border-white/5 font-medium text-xs px-5 hover:bg-destructive/10 hover:text-destructive group transition-all"
            onClick={() => router.push(`/admin/exams/${id}`)}
          >
            Cancel Changes
          </Button>
          <Button 
            onClick={() => handleSubmit()} 
            disabled={isSaving}
            className="rounded-full h-9 font-medium text-xs px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-2" />
            )}
            Synchronize
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Base Configuration Card */}
          <Card className="border-none shadow-glass glass-card overflow-hidden">
             <div className="h-1 w-full bg-gradient-to-r from-primary/80 to-primary/20" />
             <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-muted-foreground/60">
                   <ClipboardList className="w-4 h-4 text-primary" /> Primary Manifest Data
                </CardTitle>
             </CardHeader>
             <CardContent className="space-y-6 pt-2">
                <div className="space-y-2.5">
                   <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Manifest Title</Label>
                   <Input 
                      id="title" 
                      value={formData.title} 
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="e.g. LLM Reasoning Assessment" 
                      required
                      className="h-11 bg-background/50 border-white/5 rounded-xl text-sm font-medium focus-visible:ring-primary/20"
                   />
                </div>
                <div className="space-y-2.5">
                   <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Categorical Description</Label>
                   <Textarea 
                      id="description" 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Define the scope and objectives of this evaluation..." 
                      className="min-h-[120px] bg-background/50 border-white/5 rounded-xl text-sm font-medium focus-visible:ring-primary/20 resize-none pt-4"
                   />
                </div>
             </CardContent>
          </Card>

          {/* Logic & Performance Card */}
          <Card className="border-none shadow-glass glass-card overflow-hidden">
             <CardHeader className="pb-4 border-b border-white/5">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-muted-foreground/60">
                   <ShieldCheck className="w-4 h-4 text-primary" /> Performance Logic
                </CardTitle>
             </CardHeader>
             <CardContent className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2.5">
                   <Label htmlFor="duration" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Temporal Duration (Min)</Label>
                   <Input 
                      id="duration" 
                      type="number"
                      value={formData.duration} 
                      onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                      className="h-11 bg-background/50 border-white/5 rounded-xl text-sm font-medium"
                   />
                </div>
                <div className="space-y-2.5">
                   <Label htmlFor="passMark" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Proficiency Threshold (%)</Label>
                   <Input 
                      id="passMark" 
                      type="number"
                      value={formData.passMark} 
                      onChange={(e) => setFormData({...formData, passMark: parseInt(e.target.value)})}
                      className="h-11 bg-background/50 border-white/5 rounded-xl text-sm font-medium"
                   />
                </div>
                <div className="space-y-2.5">
                   <Label htmlFor="maxAttempts" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Max Iterations Allowed</Label>
                   <Input 
                      id="maxAttempts" 
                      type="number"
                      value={formData.maxAttempts} 
                      onChange={(e) => setFormData({...formData, maxAttempts: parseInt(e.target.value)})}
                      className="h-11 bg-background/50 border-white/5 rounded-xl text-sm font-medium"
                   />
                </div>
             </CardContent>
          </Card>

          {/* Question Images Management Card */}
          {exam?.questions && exam.questions.length > 0 && (
            <Card className="border-none shadow-glass glass-card overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-violet-500/60 to-violet-500/10" />
              <CardHeader className="pb-4 border-b border-white/5">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-muted-foreground/60">
                  <ImageIcon className="w-4 h-4 text-violet-500" /> Question Reference Images
                </CardTitle>
                <p className="text-[10px] font-medium text-muted-foreground/40 mt-1">
                  Manage the reference images attached to each question. These images are displayed to users during the exam.
                </p>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {exam.questions.sort((a, b) => (a.order || 0) - (b.order || 0)).map((q, idx) => (
                  <div key={q.id} className="rounded-2xl border border-white/5 bg-foreground/[0.02] overflow-hidden">
                    {/* Question Header */}
                    <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5 bg-foreground/[0.02]">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                        {idx + 1}
                      </div>
                      <p className="text-xs font-medium text-foreground/70 line-clamp-1 flex-1">
                        {q.content}
                      </p>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/30 shrink-0">
                        {q.type}
                      </span>
                    </div>

                    {/* Image Section */}
                    <div className="p-5">
                      {q.image ? (
                        <div className="space-y-4">
                          {/* Current Image Preview */}
                          <div className="relative rounded-xl overflow-hidden border border-white/10 bg-foreground/[0.02]">
                            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-foreground/[0.03]">
                              <ImageIcon className="w-3.5 h-3.5 text-primary/60" />
                              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">Current Reference Image</span>
                              <a 
                                href={q.image} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-auto flex items-center gap-1 text-[9px] font-medium text-primary/60 hover:text-primary transition-colors"
                              >
                                <ZoomIn className="w-3 h-3" /> View Full Size
                              </a>
                            </div>
                            <div className="p-3">
                              <img 
                                src={q.image}
                                alt={`Reference image for question ${idx + 1}`}
                                className="w-full max-h-[400px] object-contain rounded-lg"
                              />
                            </div>
                          </div>
                          
                          {/* Replace Image Button */}
                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id={`edit-q-img-${q.id}`}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(q.id, file);
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-xl h-9 px-4 font-medium text-[10px] uppercase tracking-wider border-white/5 hover:bg-primary/10 hover:text-primary transition-all"
                              disabled={uploadingImage === q.id}
                              onClick={() => document.getElementById(`edit-q-img-${q.id}`)?.click()}
                            >
                              {uploadingImage === q.id ? (
                                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5 mr-2" />
                              )}
                              Replace Image
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-white/10 bg-foreground/[0.01]">
                          <ImageIcon className="w-10 h-10 text-muted-foreground/10 mb-3" />
                          <p className="text-xs font-medium text-muted-foreground/30 mb-4">No reference image attached</p>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id={`edit-q-img-${q.id}`}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(q.id, file);
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-xl h-9 px-5 font-medium text-[10px] uppercase tracking-wider border-white/5 hover:bg-primary/10 hover:text-primary transition-all"
                            disabled={uploadingImage === q.id}
                            onClick={() => document.getElementById(`edit-q-img-${q.id}`)?.click()}
                          >
                            {uploadingImage === q.id ? (
                              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5 mr-2" />
                            )}
                            Upload Image
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-8">
           <Card className="border-none shadow-glass glass-card bg-primary/[0.02]">
              <CardHeader className="pb-4 border-b border-white/5">
                 <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" /> Deployment
                 </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                 <div className="flex items-center justify-between p-4 rounded-2xl bg-foreground/[0.03] border border-white/5">
                    <div className="space-y-0.5">
                       <p className="text-xs font-bold text-foreground/80">Active Deployment</p>
                       <p className="text-[9px] font-medium text-muted-foreground/40 uppercase">Visible to all participants</p>
                    </div>
                    <Switch 
                       checked={formData.isActive}
                       onCheckedChange={(checked: boolean) => setFormData({...formData, isActive: checked})}
                    />
                 </div>

                 <div className="p-4 rounded-2xl bg-destructive/[0.03] border border-destructive/5 space-y-3">
                    <div className="flex items-center gap-2 text-destructive mb-1">
                       <AlertTriangle className="w-3.5 h-3.5" />
                       <span className="text-[10px] font-bold uppercase tracking-widest">Cautionary Alert</span>
                    </div>
                    <p className="text-[10px] font-medium text-muted-foreground/60 leading-relaxed italic">
                       Modifying manifest parameters while an assessment is live may introduce reporting discrepancies for currently active sessions.
                    </p>
                 </div>
              </CardContent>
           </Card>

           <Button 
             variant="destructive" 
             className="w-full rounded-2xl h-11 font-semibold text-xs uppercase tracking-widest shadow-xl shadow-destructive/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
           >
             <Trash2 className="w-4 h-4 mr-2" /> Deactivate Manifest
           </Button>
        </div>
      </form>
    </div>
  );
}
