/**
 * @file page.tsx
 * @description The administrative audit log interface.
 * Provides transparency into system changes by tracking all 
 * administrative actions (e.g., status updates, attempt resets).
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { 
  History, 
  RefreshCw, 
  User, 
  Shield, 
  AlertCircle,
  Clock,
  Search,
  Filter,
  ChevronLeft
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

/**
 * Interface representing an administrative action log entry.
 */
interface AdminAction {
  id: string;
  adminId: string;
  targetId: string | null;
  actionType: string;
  description: string;
  createdAt: string;
  admin: { fullName: string; email: string };
  target: { fullName: string; email: string } | null;
}

/**
 * Admin Audit Logs Page Component
 * Redesigned with glassmorphism and refined sizing.
 */
export default function AdminAuditLogsPage() {
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [filteredActions, setFilteredActions] = useState<AdminAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = actions.filter(
        (action) =>
          action.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          action.admin.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          action.target?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          action.actionType.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredActions(filtered);
    } else {
      setFilteredActions(actions);
    }
  }, [searchQuery, actions]);

  /**
   * Fetches the 100 most recent administrative actions.
   */
  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await api.getAdminActions();
      setActions(response.actions);
      setFilteredActions(response.actions);
    } catch (error: any) {
      toast({
        title: 'Sync Error',
        description: error.response?.data?.error || 'Failed to synchronize system audit logs.',
        variant: 'destructive',
      });
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
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground animate-pulse">Synchronizing Logs</p>
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
              Audit Logs
            </h2>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium ml-10">
             <History className="w-3.5 h-3.5" /> Comprehensive tracking of all administrative system interactions
          </p>
        </div>
        <Button 
          onClick={fetchLogs} 
          variant="outline" 
          className="rounded-full glass h-9 px-5 border-white/5 font-medium text-xs transition-all hover:scale-105"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-2" />
          Refresh Registry
        </Button>
      </div>

      {/* Persistence / Search Bar */}
      <div className="relative group">
        <div className="absolute inset-0 bg-primary/5 blur-xl group-focus-within:bg-primary/10 transition-all rounded-2xl" />
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/30 w-4 h-4 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by admin, target, or action description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 bg-background/50 border-white/5 rounded-xl shadow-lg shadow-black/5 text-sm font-medium placeholder:text-muted-foreground/30 focus-visible:ring-primary/20"
          />
        </div>
      </div>

      {/* Log Feed Card */}
      <Card className="border-none shadow-glass glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-foreground/[0.02] border-b border-white/5">
                  <th className="px-6 py-4 font-semibold text-[9px] uppercase tracking-wider text-muted-foreground">Administrator</th>
                  <th className="px-6 py-4 font-semibold text-[9px] uppercase tracking-wider text-muted-foreground">Action Type</th>
                  <th className="px-6 py-4 font-semibold text-[9px] uppercase tracking-wider text-muted-foreground">Description</th>
                  <th className="px-6 py-4 font-semibold text-[9px] uppercase tracking-wider text-muted-foreground">Target</th>
                  <th className="px-6 py-4 font-semibold text-[9px] uppercase tracking-wider text-muted-foreground text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredActions.length > 0 ? (
                  filteredActions.map((action) => (
                    <tr 
                      key={action.id} 
                      className="group hover:bg-primary/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary border border-primary/10 text-xs shadow-sm">
                            <Shield className="w-3.5 h-3.5" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                              {action.admin.fullName}
                            </div>
                            <div className="text-[10px] font-medium text-muted-foreground/40">
                              {action.admin.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "rounded-full px-2.5 py-0.5 font-semibold text-[8px] uppercase tracking-wider border-white/5 bg-foreground/[0.03] text-foreground/70",
                            action.actionType.includes('RESET') && "text-blue-400 bg-blue-400/5",
                            action.actionType.includes('DISQUALIFY') && "text-destructive bg-destructive/5",
                            action.actionType.includes('REACTIVATE') && "text-emerald-400 bg-emerald-400/5"
                          )}
                        >
                          {action.actionType.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                         <div className="text-[11px] font-medium text-muted-foreground/80 leading-relaxed max-w-xs truncate lg:max-w-md">
                           {action.description}
                         </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {action.target ? (
                          <div className="flex items-center gap-2.5">
                             <User className="w-3 h-3 text-muted-foreground/30" />
                             <span className="text-xs font-medium text-foreground/80">{action.target.fullName}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-medium text-muted-foreground/30 uppercase italic">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex flex-col items-end">
                           <div className="text-[11px] font-semibold text-foreground/80">
                             {new Date(action.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                           </div>
                           <div className="text-[9px] font-medium text-muted-foreground/30 flex items-center gap-1 uppercase tracking-tighter">
                             <Clock className="w-2.5 h-2.5" />
                             {new Date(action.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                       <div className="flex flex-col items-center justify-center space-y-3">
                          <AlertCircle className="w-10 h-10 text-muted-foreground/20" />
                          <p className="text-sm font-medium text-muted-foreground/40 italic">No audit records found matching your search criteria.</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
