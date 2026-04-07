"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Layout, Search, RefreshCw, UserCheck, UserX, Eye, Loader2, Trash, User as UserIcon, Shield, Mail, Phone, Calendar } from "lucide-react";

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
    <div className="space-y-10 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-semibold text-foreground">
            User Management
          </h2>
          <p className="text-muted-foreground flex items-center gap-2 font-medium">
            <Layout className="w-4 h-4" /> View and manage user accounts and application status
          </p>
        </div>
        <Button onClick={fetchUsers} variant="outline" className="rounded-full glass h-11 px-6 border-white/5 font-medium transition-all hover:scale-105">
          <RefreshCw className={cn("w-4 h-4 mr-2", isUpdatingStatus && "animate-spin")} />
          Refresh Users
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="relative group">
        <div className="absolute inset-0 bg-primary/5 blur-xl group-focus-within:bg-primary/10 transition-all rounded-2xl" />
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/30 w-4 h-4 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 bg-background/50 border-white/5 rounded-xl shadow-lg shadow-black/5 text-sm font-medium placeholder:text-muted-foreground/30 focus-visible:ring-primary/20"
          />
        </div>
      </div>

      {/* Modern Table Surface */}
      <Card className="border-none shadow-glass glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-foreground/[0.02] border-b border-white/5">
                  <th className="px-6 py-4 font-semibold text-[9px] uppercase tracking-wider text-muted-foreground">User</th>
                  <th className="px-6 py-4 font-semibold text-[9px] uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-4 font-semibold text-[9px] uppercase tracking-wider text-muted-foreground text-center">Attempts</th>
                  <th className="px-6 py-4 font-semibold text-[9px] uppercase tracking-wider text-muted-foreground">Joined</th>
                  <th className="px-6 py-4 font-semibold text-[9px] uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="group hover:bg-primary/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary border border-primary/10 text-xs">
                          {user.fullName[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {user.fullName}
                          </div>
                          <div className="text-[10px] font-medium text-muted-foreground/50">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={user.status === "ELIGIBLE" ? "success" : "destructive"}
                        className="rounded-full px-3 py-1 font-semibold text-[9px] uppercase tracking-wider shadow-md shadow-black/5 border-none"
                      >
                        {user.status === "ELIGIBLE" ? "Eligible" : "Disqualified"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                       <div className="inline-flex flex-col items-center">
                         <span className="text-sm font-semibold">{user.attempts} <span className="text-muted-foreground/30 mx-1">/</span> {user.maxAttempts}</span>
                         <div className="mt-1 h-0.5 w-12 bg-foreground/5 rounded-full overflow-hidden">
                           <div className="h-full bg-primary" style={{ width: `${(user.attempts / user.maxAttempts) * 100}%` }} />
                         </div>
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-normal text-muted-foreground/60">
                      {new Date(user.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
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

      {/* Premium Profile Modal */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl border-none shadow-2xl glass-card overflow-hidden p-0 gap-0">
          <DialogHeader className="p-8 bg-primary/10 border-b border-primary/10">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-3xl bg-primary/20 backdrop-blur-md flex items-center justify-center border border-primary/20 shadow-xl shadow-primary/10">
                 <UserIcon className="w-10 h-10 text-primary" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-3xl font-semibold mb-1">
                  User Details
                </DialogTitle>
                <DialogDescription className="font-medium text-primary/60 uppercase tracking-wider text-[10px]">
                  ID: {selectedUser?.id?.slice(0, 12)}...
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedUser && (
            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <ProfileItem icon={Shield} label="Identifier" value={selectedUser.fullName} />
              <ProfileItem icon={Mail} label="Email" value={selectedUser.email} />
              <ProfileItem icon={Phone} label="Phone" value={selectedUser.phone || "Not Disclosed"} />
              <ProfileItem icon={Calendar} label="Joined" value={new Date(selectedUser.createdAt).toLocaleDateString([], { dateStyle: 'long' })} />
              
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Policy Coverage</p>
                <div className="p-4 rounded-2xl bg-foreground/[0.03] border border-white/5 flex items-center justify-between">
                   <p className="text-sm font-medium">Attempts Consumed</p>
                   <p className="text-lg font-semibold">{selectedUser.attempts} <span className="text-muted-foreground/30 text-sm">/ {selectedUser.maxAttempts}</span></p>
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Access Status</p>
                <div className="p-4 rounded-2xl bg-foreground/[0.03] border border-white/5 flex items-center justify-between">
                   <p className="text-sm font-medium">Account Status</p>
                   <Badge variant={selectedUser.status === "ELIGIBLE" ? "success" : "destructive"}>{selectedUser.status}</Badge>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 bg-foreground/[0.02] border-t border-white/5 flex justify-end">
             <Button variant="outline" onClick={() => setShowDetailsDialog(false)} className="rounded-full px-8 glass font-medium h-11 border-white/5">
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
    <div className="flex gap-5 group">
      <div className="h-12 w-12 rounded-2xl bg-foreground/[0.03] border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:border-primary/10 transition-colors">
        <Icon className="w-5 h-5 text-muted-foreground/70 group-hover:text-primary transition-colors" />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1">{label}</p>
        <p className="text-base font-medium text-foreground leading-tight">{value}</p>
      </div>
    </div>
  );
}
