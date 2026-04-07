/**
 * @file page.tsx
 * @description Detailed profile view for a specific assessment manifest.
 * Displays all metadata, proctoring configuration, and the 
 * complete set of associated questions.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { Exam } from '@/types';
import { 
  ChevronLeft, 
  Edit, 
  Trash2, 
  Clock, 
  Target, 
  Activity, 
  FileText,
  Plus,
  HelpCircle,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  MoveUp,
  MoveDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * Admin Exam Details Page Component
 * Redesigned with glassmorphism and refined sizing.
 */
export default function AdminExamDetailsPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchExam();
  }, [id]);

  /**
   * Fetches the full exam manifest including relational data (questions/options).
   */
  const fetchExam = async () => {
    try {
      const response = await api.getExam(id);
      setExam(response.exam);
    } catch (error: any) {
      toast({
        title: 'Manifest Error',
        description: error.response?.data?.error || 'Failed to synchronize assessment data.',
        variant: 'destructive',
      });
      router.push('/admin/exams');
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
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground animate-pulse">Syncing Manifest</p>
      </div>
    );
  }

  if (!exam) return null;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-16">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all"
              onClick={() => router.push('/admin/exams')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-3xl font-semibold text-foreground">
              Exam Details
            </h2>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium ml-10">
             <FileText className="w-3.5 h-3.5" /> Granular overview of the assessment manifest configuration
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button 
             variant="outline" 
             className="rounded-full glass h-10 px-5 border-white/5 font-medium text-xs"
             onClick={() => router.push(`/admin/exams/${id}/edit`)}
           >
             <Edit className="w-3.5 h-3.5 mr-2" /> Edit Manifest
           </Button>
           <Button variant="destructive" className="rounded-full h-10 px-6 font-medium shadow-lg shadow-destructive/20 text-xs">
             <Trash2 className="w-3.5 h-3.5 mr-2" /> Deactivate
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Manifest Overview Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-glass glass-card overflow-hidden">
             <div className={cn(
               "h-1.5 w-full bg-gradient-to-r",
               exam.isActive ? "from-emerald-500/80 to-emerald-500/20" : "from-muted-foreground/30 to-muted-foreground/10"
             )} />
             <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                   <Badge variant={exam.isActive ? 'success' : 'secondary'} className="rounded-full px-2.5 py-0.5 font-semibold text-[8px] uppercase tracking-widest border-none">
                     {exam.isActive ? 'Active' : 'Offline'}
                   </Badge>
                   <span className="text-[9px] font-medium text-muted-foreground/40 uppercase tracking-tighter">
                     Created {new Date(exam.createdAt).toLocaleDateString()}
                   </span>
                </div>
                <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  {exam.title}
                </CardTitle>
                <p className="text-xs font-medium text-muted-foreground/60 leading-relaxed mt-2">
                  {exam.description || "No categorical description provided for this manifest."}
                </p>
             </CardHeader>
             <CardContent className="pt-4 border-t border-white/5 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <DetailMetric icon={Clock} label="Duration" value={`${exam.duration} Minutes`} />
                   <DetailMetric icon={Target} label="Pass Mark" value={`${exam.passMark}%`} />
                   <DetailMetric icon={Activity} label="Attempt Limit" value={`${exam.maxAttempts} Fixed`} />
                   <DetailMetric icon={HelpCircle} label="Total Queries" value={`${exam.questions?.length || 0} Items`} />
                </div>
             </CardContent>
          </Card>

          {/* Quick Actions / Status */}
          <Card className="border-none shadow-glass glass-card bg-primary/[0.02]">
             <CardHeader className="pb-3">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Configuration Status</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-xs font-medium">
                   <span className="text-muted-foreground/60">Manifest Integrity</span>
                   <span className="text-emerald-500 flex items-center gap-1.5">
                     <CheckCircle2 className="w-3.5 h-3.5" /> Validated
                   </span>
                </div>
                <div className="flex items-center justify-between text-xs font-medium">
                   <span className="text-muted-foreground/60">Proctoring Sync</span>
                   <span className="text-emerald-500 flex items-center gap-1.5">
                     <CheckCircle2 className="w-3.5 h-3.5" /> Active
                   </span>
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Question Registry Section */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                 <ClipboardListIcon className="w-5 h-5 text-primary" /> Question Registry
              </h3>
              <Button size="sm" className="rounded-xl h-8 px-4 font-medium text-[10px] uppercase tracking-wider bg-primary/10 text-primary hover:bg-primary/20 border-none shadow-none">
                 <Plus className="w-3.5 h-3.5 mr-1.5" /> Append Question
              </Button>
           </div>

           <div className="space-y-4">
              {exam.questions && exam.questions.length > 0 ? (
                exam.questions.sort((a, b) => (a.order || 0) - (b.order || 0)).map((q, idx) => (
                  <Card key={q.id} className="border-none shadow-glass glass-card group hover:bg-white/[0.02] transition-all overflow-hidden">
                     <CardContent className="p-0">
                        <div className="flex divide-x divide-white/5">
                           {/* Sequence Panel */}
                           <div className="w-12 bg-foreground/[0.02] flex flex-col items-center justify-center py-4 space-y-2 shrink-0">
                              <span className="text-xs font-bold text-muted-foreground/30">{idx + 1}</span>
                              <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button className="text-muted-foreground/20 hover:text-primary transition-colors"><MoveUp className="w-3 h-3" /></button>
                                 <button className="text-muted-foreground/20 hover:text-primary transition-colors"><MoveDown className="w-3 h-3" /></button>
                              </div>
                           </div>
                           {/* Content Panel */}
                           <div className="flex-1 p-5 space-y-4">
                              <div className="flex items-start justify-between">
                                 <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="rounded-full border-white/5 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 bg-foreground/[0.03]">
                                       {q.type}
                                    </Badge>
                                    <span className="text-[10px] font-medium text-muted-foreground/40">{q.points} Points</span>
                                 </div>
                                 <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10">
                                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                 </Button>
                              </div>
                              <p className="text-sm font-medium text-foreground/90 leading-relaxed">
                                {q.content}
                              </p>
                              {q.type === 'MCQ' && q.options && q.options.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                  {q.options.sort((a, b) => a.order - b.order).map((opt) => (
                                    <div key={opt.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-foreground/[0.02] border border-white/5 text-xs font-medium text-muted-foreground/80">
                                       <div className="w-4 h-4 rounded-full border border-white/10 shrink-0" />
                                       {opt.content}
                                    </div>
                                  ))}
                                </div>
                              )}
                           </div>
                        </div>
                     </CardContent>
                  </Card>
                ))
              ) : (
                <div className="py-20 text-center glass-card rounded-3xl border border-white/5 bg-foreground/[0.01]">
                   <AlertTriangle className="w-12 h-12 text-muted-foreground/10 mx-auto mb-4" />
                   <p className="text-sm font-medium text-muted-foreground/40 italic">No instructions or queries registered in this manifest.</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}

function DetailMetric({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="p-3.5 rounded-2xl bg-foreground/[0.02] border border-white/5 space-y-1 group hover:bg-foreground/[0.04] transition-colors">
       <div className="flex items-center gap-2">
          <Icon className="w-3 h-3 text-primary/60" />
          <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/30">{label}</span>
       </div>
       <p className="text-sm font-semibold text-foreground/90">{value}</p>
    </div>
  );
}

function ClipboardListIcon({ className }: { className?: string }) {
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
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}
