"use client";

import { useEffect, useState } from "react";
import { Card, CardContent} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import { User } from "@/types";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Layout, Search, RefreshCw, UserCheck, UserX, Eye, Loader2, Trash, User as UserIcon, Shield, Mail, Phone, Calendar, ShieldCheck, Download } from "lucide-react";

/**
 * Admin User Management Component
 * Redesigned with glassmorphism and theme support.
 */
export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isResetting, setIsResetting] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(
        (user) =>
          user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      const response = await api.getAllUsers();
      setUsers(response.users);
      setFilteredUsers(response.users);
    } catch (error: any) {
      toast({
        title: "System Synchronization Failed",
        description: error.response?.data?.error || "Unable to harmonize user directory.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetAttempts = async (userId: string) => {
    setIsResetting(userId);
    try {
      await api.resetAttempts(userId);
      toast({
        title: "Protocol Success",
        description: "User attempt quota has been restored.",
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Task Exception",
        description: error.response?.data?.error || "Quota reset failed.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(null);
    }
  };

  const verifyUser = async (userId: string) => {
    setIsVerifying(userId);
    try {
      await api.adminVerifyUser(userId);
      toast({
        title: "Identity Verified",
        description: "User email, phone, and NIN verified safely.",
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.response?.data?.error || "Could not manually verify user identity.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(null);
    }
  };

  const updateStatus = async (
    userId: string,
    status: "ELIGIBLE" | "DISQUALIFIED",
  ) => {
    setIsUpdatingStatus(userId);
    try {
      await api.updateUserStatus(userId, status);
      toast({
        title: "Access Policy Updated",
        description: `Subject is now ${status.toLowerCase()}.`,
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Policy Exception",
        description: error.response?.data?.error || "Status update failed.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const viewDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetailsDialog(true);
  };

  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const delUser = async (userId: string) => {
    setIsDeleting(userId);
    try {
      await api.deleteUser(userId);
      toast({
        title: "Identity Purged",
        description: "User records have been removed.",
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Decline Policy",
        description: error.response?.data?.error || "Deletion failed.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleExport = async (type: 'QUALIFIED' | 'DISQUALIFIED') => {
    setIsExporting(type);
    try {
      const blob = type === 'QUALIFIED' 
        ? await api.exportQualifiedUsers() 
        : await api.exportDisqualifiedUsers();
        
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type.toLowerCase()}-users-report.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: `Successfully downloaded ${type.toLowerCase()} users.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not generate or download the excel report.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground animate-pulse">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">
            User Management
          </h2>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Layout className="w-4 h-4" /> Manage user accounts and application status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => handleExport('QUALIFIED')} 
            variant="outline" 
            disabled={isExporting !== null}
            className="h-9 px-4 text-sm rounded-lg"
          >
            {isExporting === 'QUALIFIED' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export Qualified
          </Button>
          <Button 
            onClick={() => handleExport('DISQUALIFIED')} 
            variant="outline" 
            disabled={isExporting !== null}
            className="h-9 px-4 text-sm rounded-lg"
          >
            {isExporting === 'DISQUALIFIED' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2 text-destructive" />}
            Export Disqualified
          </Button>
          <Button onClick={fetchUsers} className="h-9 px-4 text-sm rounded-lg">
            <RefreshCw className={cn("w-4 h-4 mr-2", isUpdatingStatus && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-9 rounded-lg text-sm placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Table */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-center">Attempts</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Joined</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center font-medium text-primary text-sm">
                          {user.fullName[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground flex items-center gap-2">
                            {user.fullName}
                            {(user.emailVerified && user.ninVerified) && (
                              <span title="Verified Identity" className="flex items-center">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-medium text-muted-foreground/50">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant={user.status === "ELIGIBLE" ? "success" : "destructive"}
                        className="rounded-md px-2 py-0.5 text-xs"
                      >
                        {user.status === "ELIGIBLE" ? "Eligible" : "Disqualified"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                       <div className="inline-flex flex-col items-center">
                         <span className="text-sm font-medium">{user.attempts} <span className="text-muted-foreground">/</span> {user.maxAttempts}</span>
                         <div className="mt-1 h-0.5 w-12 bg-muted rounded-full overflow-hidden">
                           <div className="h-full bg-primary" style={{ width: `${(user.attempts / user.maxAttempts) * 100}%` }} />
                         </div>
                       </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-normal text-muted-foreground/60">
                      {new Date(user.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                          onClick={() => viewDetails(user)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                          onClick={() => resetAttempts(user.id)}
                          disabled={isResetting === user.id}
                        >
                          {isResetting === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-zinc-500/10 hover:text-zinc-500 transition-all"
                          onClick={() => verifyUser(user.id)}
                          title="Manually Verify User"
                          disabled={isVerifying === user.id}
                        >
                          {isVerifying === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-4 h-4" />
                          )}
                        </Button>
                        {user.status === "ELIGIBLE" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all"
                            onClick={() => updateStatus(user.id, "DISQUALIFIED")}
                            disabled={isUpdatingStatus === user.id}
                          >
                            {isUpdatingStatus === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserX className="w-4 h-4" />
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500 transition-all"
                            onClick={() => updateStatus(user.id, "ELIGIBLE")}
                            disabled={isUpdatingStatus === user.id}
                          >
                            {isUpdatingStatus === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all"
                          onClick={() => delUser(user.id)}
                          disabled={isDeleting === user.id}
                        >
                          {isDeleting === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Profile Modal */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg glass-card overflow-hidden p-0 gap-0">
          <DialogHeader className="p-4 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                 <UserIcon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-lg font-semibold">
                  User Details
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  ID: {selectedUser?.id?.slice(0, 12)}...
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedUser && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProfileItem icon={Shield} label="Name" value={selectedUser.fullName} />
              <ProfileItem icon={Mail} label="Email" value={selectedUser.email} />
              <ProfileItem icon={Phone} label="Phone" value={selectedUser.phone || "Not provided"} />
              <ProfileItem icon={Calendar} label="Joined" value={new Date(selectedUser.createdAt).toLocaleDateString([], { dateStyle: 'long' })} />
              
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Attempts</p>
                <div className="p-3 rounded-lg border border-border flex items-center justify-between">
                   <p className="text-sm">Consumed</p>
                   <p className="text-sm font-semibold">{selectedUser.attempts} <span className="text-muted-foreground">/ {selectedUser.maxAttempts}</span></p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Access</p>
                <div className="p-3 rounded-lg border border-border flex items-center justify-between">
                   <p className="text-sm">Status</p>
                   <div className="flex items-center gap-2">
                     {(selectedUser.ninVerified || selectedUser.emailVerified) && (
                       <Badge variant="outline" className="rounded-md text-xs px-2 py-0.5 border-blue-500/30 text-blue-500 bg-blue-500/5">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Verified
                       </Badge>
                     )}
                     <Badge variant={selectedUser.status === "ELIGIBLE" ? "success" : "destructive"} className="rounded-md text-xs px-2 py-0.5">{selectedUser.status}</Badge>
                   </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 border-t border-border flex justify-end">
             <Button variant="outline" onClick={() => setShowDetailsDialog(false)} className="h-9 px-4 rounded-lg text-sm">
                Close
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfileItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex gap-3">
      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
