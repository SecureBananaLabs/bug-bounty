"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type TabKey = "dashboard" | "users" | "moderation" | "disputes" | "settings" | "audit";

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "users", label: "Users" },
    { key: "moderation", label: "Moderation" },
    { key: "disputes", label: "Disputes" },
    { key: "settings", label: "Settings" },
    { key: "audit", label: "Audit Log" },
  ];

  return (
    <div className="flex h-full gap-6 p-6">
      {/* Sidebar */}
      <nav className="w-48 shrink-0 space-y-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
              activeTab === t.key
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
            aria-current={activeTab === t.key ? "page" : undefined}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto" role="tabpanel" aria-label={activeTab}>
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "moderation" && <ModerationTab />}
        {activeTab === "disputes" && <DisputesTab />}
        {activeTab === "settings" && <SettingsTab />}
        {activeTab === "audit" && <AuditLogTab />}
      </main>
    </div>
  );
}

// ============== Dashboard ==============
function DashboardTab() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/metrics");
      const json = await res.json();
      if (json.success) setMetrics(json.data);
    } catch { toast.error("Failed to load metrics"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMetrics(); }, []);

  if (loading) return <div className="grid grid-cols-3 gap-4">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>;

  const cards = [
    { title: "Total Users", value: metrics?.totalUsers ?? "—" },
    { title: "Active Jobs", value: metrics?.activeJobs ?? "—" },
    { title: "Open Disputes", value: metrics?.openDisputes ?? "—" },
    { title: "Flagged Jobs", value: metrics?.flaggedJobs ?? "—" },
    { title: "Revenue", value: metrics?.revenue ? `$${metrics.revenue.toLocaleString()}` : "—" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <Button variant="outline" size="sm" onClick={fetchMetrics}>Refresh</Button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {cards.map(c => (
          <Card key={c.title}>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{c.title}</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{c.value}</p></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============== Users ==============
function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      if (json.success) { setUsers(json.data.items); setTotal(json.data.pagination.total); }
    } catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const handleAction = async (id: string, action: "ban" | "unban" | "delete") => {
    try {
      const res = await fetch(`/api/admin/users/${id}/${action}`, { method: action === "delete" ? "DELETE" : "PATCH" });
      const json = await res.json();
      if (json.success) { toast.success(`User ${action}ed`); fetchUsers(); }
      else toast.error(json.message);
    } catch { toast.error("Action failed"); }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">User Management</h2>
      <div className="flex gap-2">
        <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        <Button onClick={() => { setPage(1); fetchUsers(); }}>Search</Button>
      </div>

      {loading ? <Skeleton className="h-64 w-full" /> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                <TableCell><Badge variant={u.status === "BANNED" ? "destructive" : "default"}>{u.status}</Badge></TableCell>
                <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="space-x-1">
                  {u.status === "BANNED"
                    ? <Button size="sm" variant="outline" onClick={() => handleAction(u.id, "unban")}>Unban</Button>
                    : <Button size="sm" variant="outline" onClick={() => handleAction(u.id, "ban")}>Ban</Button>
                  }
                  <Button size="sm" variant="destructive" onClick={() => handleAction(u.id, "delete")}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Total: {total}</span>
        <div className="space-x-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
          <Button size="sm" variant="outline" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}

// ============== Moderation ==============
function ModerationTab() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/jobs/flagged?page=${page}&pageSize=20`);
      const json = await res.json();
      if (json.success) { setJobs(json.data.items); setTotal(json.data.pagination.total); }
    } catch { toast.error("Failed to load flagged jobs"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, [page]);

  const handleModeration = async (id: string, action: "approve" | "reject") => {
    const reason = action === "reject" ? prompt("Rejection reason:") : undefined;
    if (action === "reject" && !reason) return;
    try {
      const res = await fetch(`/api/admin/jobs/${id}/${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      if (json.success) { toast.success(`Job ${action}d`); fetchJobs(); }
      else toast.error(json.message);
    } catch { toast.error("Action failed"); }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Job Moderation</h2>
      {loading ? <Skeleton className="h-64 w-full" /> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map(j => (
              <TableRow key={j.id}>
                <TableCell>{j.title}</TableCell>
                <TableCell>{j.client?.name ?? "—"}</TableCell>
                <TableCell>${j.budgetMin}–${j.budgetMax}</TableCell>
                <TableCell><Badge variant="secondary">{j.status}</Badge></TableCell>
                <TableCell className="space-x-1">
                  <Button size="sm" onClick={() => handleModeration(j.id, "approve")}>Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleModeration(j.id, "reject")}>Reject</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// ============== Disputes ==============
function DisputesTab() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/disputes?${params}`);
      const json = await res.json();
      if (json.success) { setDisputes(json.data.items); setTotal(json.data.pagination.total); }
    } catch { toast.error("Failed to load disputes"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDisputes(); }, [page, statusFilter]);

  const handleRule = async (id: string, ruling: string) => {
    try {
      const res = await fetch(`/api/admin/disputes/${id}/rule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruling, reason: "Admin decision" }),
      });
      const json = await res.json();
      if (json.success) { toast.success("Ruling applied"); fetchDisputes(); setSelected(null); }
      else toast.error(json.message);
    } catch { toast.error("Action failed"); }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Disputes</h2>
      <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
        <SelectTrigger className="w-48"><SelectValue placeholder="All statuses" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="">All</SelectItem>
          <SelectItem value="OPEN">Open</SelectItem>
          <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
          <SelectItem value="RESOLVED">Resolved</SelectItem>
        </SelectContent>
      </Select>

      {loading ? <Skeleton className="h-64 w-full" /> : (
        <Table>
          <TableHeader>
            <TableRow><TableHead>ID</TableHead><TableHead>Raised By</TableHead><TableHead>Against</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {disputes.map(d => (
              <TableRow key={d.id}>
                <TableCell className="font-mono text-xs">{d.id.slice(0, 8)}</TableCell>
                <TableCell>{d.raisedBy?.name ?? "—"}</TableCell>
                <TableCell>{d.against?.name ?? "—"}</TableCell>
                <TableCell><Badge>{d.status}</Badge></TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => setSelected(d)}>Details</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Dispute Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-2 text-sm">
              <p><strong>Reason:</strong> {selected.reason}</p>
              <p><strong>Status:</strong> {selected.status}</p>
              <p><strong>Created:</strong> {new Date(selected.createdAt).toLocaleString()}</p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handleRule(selected?.id, "in_favor_of_client")}>Rule for Client</Button>
            <Button variant="outline" onClick={() => handleRule(selected?.id, "in_favor_of_freelancer")}>Rule for Freelancer</Button>
            <Button variant="secondary" onClick={() => handleRule(selected?.id, "escalated")}>Escalate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============== Settings ==============
function SettingsTab() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const json = await res.json();
      if (json.success) setSettings(json.data);
    } catch { toast.error("Failed to load settings"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSettings(); }, []);

  const toggleSetting = async (key: string) => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: !settings[key] }),
      });
      const json = await res.json();
      if (json.success) { setSettings(json.data); toast.success("Setting updated"); }
      else toast.error(json.message);
    } catch { toast.error("Failed to update"); }
    setConfirmDialog(null);
  };

  if (loading) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Platform Settings</h2>
      <Card>
        <CardContent className="space-y-4 pt-6">
          {[
            { key: "registrationOpen", label: "New User Registration" },
            { key: "jobPostingOpen", label: "New Job Postings" },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <span className="font-medium">{item.label}</span>
              <Button
                variant={settings?.[item.key] ? "default" : "secondary"}
                onClick={() => setConfirmDialog(item.key)}
              >
                {settings?.[item.key] ? "Enabled" : "Disabled"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Change</DialogTitle></DialogHeader>
          <p className="text-sm">Are you sure you want to change this setting?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancel</Button>
            <Button onClick={() => confirmDialog && toggleSetting(confirmDialog)}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============== Audit Log ==============
function AuditLogTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/admin/audit-log?pageSize=50");
        const json = await res.json();
        if (json.success) setLogs(json.data.items ?? json.data ?? []);
      } catch { toast.error("Failed to load audit log"); }
      finally { setLoading(false); }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Audit Log</h2>
      {loading ? <Skeleton className="h-64 w-full" /> : (
        <Table>
          <TableHeader>
            <TableRow><TableHead>Action</TableHead><TableHead>Target</TableHead><TableHead>Admin</TableHead><TableHead>Time</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((l, i) => (
              <TableRow key={l.id ?? i}>
                <TableCell className="font-mono text-xs">{l.action}</TableCell>
                <TableCell>{l.targetType}:{l.targetId?.slice(0, 8) ?? "—"}</TableCell>
                <TableCell>{l.actorId?.slice(0, 8)}</TableCell>
                <TableCell>{new Date(l.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
