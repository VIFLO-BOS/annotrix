"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { Exam } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Clock,
  Loader2,
  FileText,
  Target,
  Users,
  Activity,
  AlertTriangle,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Extended Exam type that includes relation counts returned by Prisma.
 */
interface ExamWithCounts extends Exam {
  _count?: {
    questions: number;
    attempts: number;
  };
}

/**
 * Admin Exams Management Component
 * Redesigned with glassmorphism and theme support.
 */
export default function AdminExamsPage() {
  const [exams, setExams] = useState<ExamWithCounts[]>([]);
  const [filteredExams, setFilteredExams] = useState<ExamWithCounts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = exams.filter(
        (exam) =>
          exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (exam.description && exam.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredExams(filtered);
    } else {
      setFilteredExams(exams);
    }
  }, [searchQuery, exams]);

  const fetchExams = async () => {
    try {
      const response = await api.getExams();
      setExams(response.exams);
      setFilteredExams(response.exams);
    } catch (error: any) {
      toast({
        title: 'Registry Error',
        description: error.response?.data?.error || 'Unable to synchronize assessment manifests.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteExam = async () => {
    if (!examToDelete) return;

    setIsDeleting(true);
    try {
      await api.deleteExam(examToDelete.id);
      toast({
        title: 'Manifest Purged',
        description: 'The assessment has been permanently erased from the platform.',
      });
      fetchExams();
    } catch (error: any) {
      toast({
        title: 'Purge Failed',
        description: error.response?.data?.error || 'An unexpected error blocked the deletion script.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setExamToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground animate-pulse">Loading exams...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-semibold text-foreground">
            Exam Management
          </h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
             <Activity className="w-3.5 h-3.5" /> View and manage assessment manifests and questions
          </p>
        </div>
        <Button 
          onClick={() => router.push('/admin/exams/create')}
          className="rounded-full h-10 px-6 font-medium text-xs uppercase tracking-wider shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 mr-2 stroke-[2px]" />
          Create New Exam
        </Button>
      </div>

      <div className="relative group">
        <div className="absolute inset-0 bg-primary/5 blur-xl group-focus-within:bg-primary/10 transition-all rounded-2xl" />
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/30 w-4 h-4 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search exams by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 bg-background/50 border-white/5 rounded-xl shadow-lg shadow-black/5 text-sm font-medium placeholder:text-muted-foreground/30 focus-visible:ring-primary/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredExams.map((exam) => (
          <Card key={exam.id} className="border-none shadow-glass glass-card group hover:scale-[1.02] transition-all duration-300 overflow-hidden">
            <div className={cn(
              "h-1.5 w-full bg-gradient-to-r transition-opacity duration-300",
              exam.isActive ? "from-emerald-500/80 to-emerald-500/20" : "from-muted-foreground/30 to-muted-foreground/10"
            )} />
            
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3 mb-1">
                <CardTitle className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors">
                  {exam.title}
                </CardTitle>
                <Badge variant={exam.isActive ? 'success' : 'secondary'} className="rounded-full px-2.5 py-0.5 font-semibold text-[9px] uppercase tracking-wider border-none shrink-0">
                  {exam.isActive ? 'Active' : 'Offline'}
                </Badge>
              </div>
              {exam.description && (
                <p className="text-xs font-medium text-muted-foreground/60 line-clamp-2 leading-relaxed">
                  {exam.description}
                </p>
              )}
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-3.5">
                <MetricItem icon={Clock} label="Duration" value={`${exam.duration}m`} />
                <MetricItem icon={Target} label="Pass Mark" value={`${exam.passMark}%`} />
                <MetricItem icon={Activity} label="Attempts" value={exam.maxAttempts.toString()} />
                <MetricItem icon={FileText} label="Questions" value={`${exam._count?.questions || 0} Qs`} />
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Users className="w-3.5 h-3.5 text-muted-foreground/40" />
                   <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                     {exam._count?.attempts || 0} Attempts
                   </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                    onClick={() => router.push(`/admin/exams/${exam.id}`)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500 transition-all"
                    onClick={() => router.push(`/admin/exams/${exam.id}/edit`)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all"
                    onClick={() => setExamToDelete(exam)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!examToDelete} onOpenChange={() => setExamToDelete(null)}>
        <AlertDialogContent className="border-none shadow-2xl glass-card max-w-md">
          <AlertDialogHeader className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-2">
               <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-2xl font-semibold">Delete Exam</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-normal text-muted-foreground/80 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-foreground">&quot;{examToDelete?.title}&quot;</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel className="rounded-full glass font-medium h-10 border-white/5 text-xs px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteExam}
              disabled={isDeleting}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-medium h-10 px-8 shadow-lg shadow-destructive/20 text-xs"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MetricItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="p-2.5 rounded-xl bg-foreground/[0.03] border border-white/5 space-y-1 group-hover:bg-foreground/[0.05] transition-colors">
      <div className="flex items-center gap-1.5">
        <Icon className="w-2.5 h-2.5 text-primary/60" />
        <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground/40">{label}</span>
      </div>
      <p className="text-xs font-medium text-foreground">{value}</p>
    </div>
  );
}

