/**
 * @file page.tsx
 * @description The proctored security violation interface.
 * Tracks flagged attempts and potential plagiarism incidents 
 * across all active assessment manifests.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  ChevronLeft, 
  Eye, 
  UserX, 
  UserCheck, 
  ShieldAlert,
  Clock,
  ExternalLink,
  ClipboardList
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

/**
 * Interface representing a plagiarism report from the backend.
 */
interface PlagiarismReport {
  id: string;
  attemptId: string;
  reason: string;
  severity: string;
  flagged: boolean;
  createdAt: string;
  attempt: {
    user: { fullName: string; email: string; id: string };
    exam: { title: string };
  };
}

/**
 * Admin Flagged Sessions Page Component
 * Redesigned with glassmorphism and refined sizing.
 */
export default function AdminFlaggedSessionsPage() {
  const [reports, setReports] = useState<PlagiarismReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<PlagiarismReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = reports.filter(
        (report) =>
          report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.attempt.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.attempt.exam.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredReports(filtered);
    } else {
      setFilteredReports(reports);
    }
  }, [searchQuery, reports]);

  /**
   * Fetches the global plagiarism and violation reports.
   */
  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const response = await api.getPlagiarismReports();
      setReports(response.reports);
      setFilteredReports(response.reports);
    } catch (error: any) {
      toast({
        title: 'Registry Error',
        description: error.response?.data?.error || 'Unable to synchronize security violation manifests.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Disqualifies a user directly from the violation interface.
   */
  const handleDisqualify = async (userId: string) => {
    try {
      await api.updateUserStatus(userId, 'DISQUALIFIED');
      toast({
        title: 'Entity Restricted',
        description: 'User access has been permanently revoked.',
      });
      fetchReports();
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.response?.data?.error || 'System failed to update user eligibility status.',
        variant: 'destructive',
      });
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
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground animate-pulse">Scanning Violations</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all"
              onClick={() => router.back()}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-3xl font-semibold text-foreground">
              Security Monitoring
            </h2>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium ml-10">
             <ShieldAlert className="w-3.5 h-3.5" /> Real-time proctoring alerts and integrity violation tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="rounded-full glass h-10 px-5 border-white/5 font-medium text-xs">
             <Filter className="w-3.5 h-3.5 mr-2" /> Filter Alerts
           </Button>
        </div>
      </div>

      {/* Persistence / Search Bar */}
      <div className="relative group">
        <div className="absolute inset-0 bg-destructive/5 blur-xl group-focus-within:bg-destructive/10 transition-all rounded-2xl" />
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/30 w-4 h-4 group-focus-within:text-destructive transition-colors" />
          <Input
            placeholder="Search by user, exam title, or violation reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 bg-background/50 border-white/5 rounded-xl shadow-lg shadow-black/5 text-sm font-medium placeholder:text-muted-foreground/30 focus-visible:ring-destructive/20"
          />
        </div>
      </div>

      {/* Violation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <Card key={report.id} className="border-none shadow-glass glass-card group hover:scale-[1.02] transition-all duration-300 overflow-hidden relative">
              <div className={cn(
                "h-1 w-full bg-gradient-to-r",
                report.severity === 'HIGH' ? "from-destructive/80 to-destructive/20" : "from-orange-500/80 to-orange-500/20"
              )} />
              
              <CardHeader className="pb-3 border-b border-white/5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <Badge 
                    variant={report.severity === 'HIGH' ? 'destructive' : 'secondary'} 
                    className="rounded-full px-2.5 py-0.5 font-semibold text-[8px] uppercase tracking-wider shadow-lg shadow-black/5"
                  >
                    {report.severity} Severity
                  </Badge>
                  <div className="flex items-center gap-1.5 text-[9px] font-medium text-muted-foreground/30 uppercase tracking-tighter">
                     <Clock className="w-2.5 h-2.5" />
                     {new Date(report.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                
                <div className="space-y-1">
                   <CardTitle className="text-lg font-semibold leading-tight group-hover:text-destructive transition-colors">
                     {report.attempt.user.fullName}
                   </CardTitle>
                   <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest">{report.attempt.exam.title}</p>
                </div>
              </CardHeader>

              <CardContent className="pt-5 space-y-5">
                 <div className="p-3.5 rounded-xl bg-destructive/[0.03] border border-destructive/5 space-y-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-destructive/60 mb-1">Violation Manifest</p>
                    <p className="text-xs font-medium text-foreground/80 leading-relaxed italic">
                      &quot;{report.reason}&quot;
                    </p>
                 </div>

                 <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between text-xs font-semibold px-1">
                       <span className="text-muted-foreground/40 uppercase tracking-widest text-[9px]">User Identity</span>
                       <span className="text-foreground/80 truncate max-w-[140px]">{report.attempt.user.email}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold px-1">
                       <span className="text-muted-foreground/40 uppercase tracking-widest text-[9px]">Incident Status</span>
                       <span className="text-orange-400">Under Review</span>
                    </div>
                 </div>
              </CardContent>

              <CardFooter className="pt-5 flex items-center gap-2">
                 <Button 
                   variant="outline" 
                   size="sm" 
                   className="flex-1 rounded-xl h-9 glass border-white/5 font-medium text-[10px] uppercase tracking-wider group-hover:bg-primary/5 transition-all"
                   onClick={() => router.push(`/admin/users?id=${report.attempt.user.id}`)}
                 >
                   <ClipboardList className="w-3 h-3 mr-1.5 opacity-60" /> Profile
                 </Button>
                 <Button 
                   variant="destructive" 
                   size="sm" 
                   className="flex-1 rounded-xl h-9 font-medium text-[10px] uppercase tracking-wider shadow-lg shadow-destructive/20 hover:scale-[1.03] active:scale-[0.98] transition-all"
                   onClick={() => handleDisqualify(report.attempt.user.id)}
                 >
                   <UserX className="w-3 h-3 mr-1.5" /> Restrict
                 </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center glass-card rounded-3xl border border-white/5 bg-emerald-500/[0.02]">
             <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-2">
                   <UserCheck className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                   <h3 className="text-xl font-bold tracking-tight text-foreground/80">Integrity Check Clear</h3>
                   <p className="text-sm font-medium text-muted-foreground mt-1">No security violations or plagiarism alerts reported in the current manifest.</p>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
