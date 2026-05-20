"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import type {
  AdminAuditEntry,
  AdminDashboardData,
  AdminDispute,
  AdminJob,
  AdminMetrics,
  AdminNotification,
  AdminSettings,
  AdminUser,
  TablePage
} from "../../lib/admin-data";
import { ADMIN_PAGE_SIZE } from "../../lib/admin-data";
import {
  AuditLogSection,
  DisputesSection,
  MetricsSection,
  ModerationSection,
  NotificationsSection,
  PlatformControlsSection,
  SectionTitle,
  UsersSection,
  type AuditFilters,
  type DisputeFilters,
  type SectionStatus,
  type UserFilters
} from "./AdminDashboardSections";

type Props = {
  token: string | null;
  initialData: AdminDashboardData;
  previewState: string;
};

type SectionKey = "metrics" | "users" | "jobs" | "disputes" | "auditLog" | "notifications" | "settings";

const defaultFilters = (): UserFilters => ({
  query: "",
  role: "",
  status: "",
  joinedAfter: "",
  joinedBefore: ""
});

const defaultAuditFilters = (): AuditFilters => ({
  admin: "",
  action: "",
  from: "",
  to: ""
});

const defaultDisputeFilters = (): DisputeFilters => ({
  status: ""
});

const defaultSectionStatus = (): Record<SectionKey, SectionStatus> => ({
  metrics: { loading: false, error: null },
  users: { loading: false, error: null },
  jobs: { loading: false, error: null },
  disputes: { loading: false, error: null },
  auditLog: { loading: false, error: null },
  notifications: { loading: false, error: null },
  settings: { loading: false, error: null }
});

export default function AdminDashboardClient({ token, initialData, previewState }: Props) {
  const [dashboard, setDashboard] = useState(initialData);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [userPage, setUserPage] = useState(initialData.users.page);
  const [jobPage, setJobPage] = useState(initialData.jobs.page);
  const [disputePage, setDisputePage] = useState(initialData.disputes.page);
  const [auditPage, setAuditPage] = useState(initialData.auditLog.page);
  const [notificationPage, setNotificationPage] = useState(initialData.notifications.page);
  const [filters, setFilters] = useState<UserFilters>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<UserFilters>(defaultFilters);
  const [disputeFilters, setDisputeFilters] = useState<DisputeFilters>(defaultDisputeFilters);
  const [draftDisputeFilters, setDraftDisputeFilters] = useState<DisputeFilters>(defaultDisputeFilters);
  const [auditFilters, setAuditFilters] = useState<AuditFilters>(defaultAuditFilters);
  const [draftAuditFilters, setDraftAuditFilters] = useState<AuditFilters>(defaultAuditFilters);
  const [selectedUserId, setSelectedUserId] = useState(initialData.users.items[0]?.id ?? null);
  const [selectedDisputeId, setSelectedDisputeId] = useState(initialData.disputes.items[0]?.id ?? null);
  const [sectionStatus, setSectionStatus] = useState<Record<SectionKey, SectionStatus>>(defaultSectionStatus);

  useEffect(() => {
    if (!selectedUserId && dashboard.users.items[0]) {
      setSelectedUserId(dashboard.users.items[0].id);
    }
  }, [dashboard.users.items, selectedUserId]);

  const selectedUser = useMemo(
    () => dashboard.users.items.find((user) => user.id === selectedUserId) ?? dashboard.users.items[0] ?? null,
    [dashboard.users.items, selectedUserId]
  );

  const selectedDispute = useMemo(
    () =>
      dashboard.disputes.items.find((dispute) => dispute.id === selectedDisputeId) ??
      dashboard.disputes.items[0] ??
      null,
    [dashboard.disputes.items, selectedDisputeId]
  );

  function authHeaders() {
    const headers: Record<string, string> = {};
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }
    return headers;
  }

  function reportError(error: unknown) {
    const message = error instanceof Error ? error.message : "Request failed";
    setMessage(message);
  }

  function updateSectionStatus(section: SectionKey, next: Partial<SectionStatus>) {
    setSectionStatus((current) => ({
      ...current,
      [section]: {
        ...current[section],
        ...next
      }
    }));
  }

  async function apiJson<T>(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers ?? {});
    for (const [key, value] of Object.entries(authHeaders())) {
      headers.set(key, value);
    }
    if (init.body && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    const response = await fetch(path, {
      ...init,
      headers,
      credentials: "include",
      cache: "no-store"
    });

    const payload = (await response.json()) as { success: boolean; data?: T; message?: string };
    if (!response.ok || !payload.success) {
      throw new Error(payload.message ?? "Request failed");
    }

    return payload.data as T;
  }

  async function loadMetricsAndSettings() {
    updateSectionStatus("metrics", { loading: true, error: null });
    updateSectionStatus("settings", { loading: true, error: null });
    try {
      const [metrics, settings] = await Promise.all([
        apiJson<AdminMetrics>("/api/admin/metrics"),
        apiJson<AdminSettings>("/api/admin/settings")
      ]);

      setDashboard((current) => ({
        ...current,
        metrics,
        settings
      }));
      updateSectionStatus("metrics", { loading: false, error: null });
      updateSectionStatus("settings", { loading: false, error: null });
      return true;
    } catch (error) {
      reportError(error);
      const message = error instanceof Error ? error.message : "Request failed";
      updateSectionStatus("metrics", { loading: false, error: message });
      updateSectionStatus("settings", { loading: false, error: message });
      return false;
    }
  }

  async function loadUsers(nextPage = userPage, nextFilters = filters) {
    updateSectionStatus("users", { loading: true, error: null });
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(ADMIN_PAGE_SIZE)
      });

      if (nextFilters.query) {
        params.set("query", nextFilters.query);
      }
      if (nextFilters.role) {
        params.set("role", nextFilters.role);
      }
      if (nextFilters.status) {
        params.set("status", nextFilters.status);
      }
      if (nextFilters.joinedAfter) {
        params.set("joinedAfter", nextFilters.joinedAfter);
      }
      if (nextFilters.joinedBefore) {
        params.set("joinedBefore", nextFilters.joinedBefore);
      }

      const users = await apiJson<TablePage<AdminUser>>(`/api/admin/users?${params.toString()}`);
      setDashboard((current) => ({ ...current, users }));
      setUserPage(nextPage);
      setFilters(nextFilters);
      if (!users.items.some((user) => user.id === selectedUserId)) {
        setSelectedUserId(users.items[0]?.id ?? null);
      }
      updateSectionStatus("users", { loading: false, error: null });
      return true;
    } catch (error) {
      reportError(error);
      const message = error instanceof Error ? error.message : "Request failed";
      updateSectionStatus("users", { loading: false, error: message });
      return false;
    }
  }

  async function loadJobs(nextPage = jobPage) {
    updateSectionStatus("jobs", { loading: true, error: null });
    try {
      const jobs = await apiJson<TablePage<AdminJob>>(
        `/api/admin/jobs?page=${nextPage}&limit=${ADMIN_PAGE_SIZE}`
      );
      setDashboard((current) => ({ ...current, jobs }));
      setJobPage(nextPage);
      updateSectionStatus("jobs", { loading: false, error: null });
      return true;
    } catch (error) {
      reportError(error);
      const message = error instanceof Error ? error.message : "Request failed";
      updateSectionStatus("jobs", { loading: false, error: message });
      return false;
    }
  }

  async function loadDisputes(nextPage = disputePage, nextFilters = disputeFilters) {
    updateSectionStatus("disputes", { loading: true, error: null });
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(ADMIN_PAGE_SIZE)
      });

      if (nextFilters.status) {
        params.set("status", nextFilters.status);
      }

      const disputes = await apiJson<TablePage<AdminDispute>>(`/api/admin/disputes?${params.toString()}`);
      setDashboard((current) => ({ ...current, disputes }));
      setDisputePage(nextPage);
      setDisputeFilters(nextFilters);
      if (!disputes.items.some((dispute) => dispute.id === selectedDisputeId)) {
        setSelectedDisputeId(disputes.items[0]?.id ?? null);
      }
      updateSectionStatus("disputes", { loading: false, error: null });
      return true;
    } catch (error) {
      reportError(error);
      const message = error instanceof Error ? error.message : "Request failed";
      updateSectionStatus("disputes", { loading: false, error: message });
      return false;
    }
  }

  async function loadAudit(nextPage = auditPage, nextFilters = auditFilters) {
    updateSectionStatus("auditLog", { loading: true, error: null });
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(ADMIN_PAGE_SIZE)
      });

      if (nextFilters.admin) {
        params.set("admin", nextFilters.admin);
      }
      if (nextFilters.action) {
        params.set("action", nextFilters.action);
      }
      if (nextFilters.from) {
        params.set("from", nextFilters.from);
      }
      if (nextFilters.to) {
        params.set("to", nextFilters.to);
      }

      const auditLog = await apiJson<TablePage<AdminAuditEntry>>(`/api/admin/audit-log?${params.toString()}`);
      setDashboard((current) => ({ ...current, auditLog }));
      setAuditPage(nextPage);
      updateSectionStatus("auditLog", { loading: false, error: null });
      return true;
    } catch (error) {
      reportError(error);
      const message = error instanceof Error ? error.message : "Request failed";
      updateSectionStatus("auditLog", { loading: false, error: message });
      return false;
    }
  }

  async function loadNotifications(nextPage = notificationPage) {
    updateSectionStatus("notifications", { loading: true, error: null });
    try {
      const notifications = await apiJson<TablePage<AdminNotification>>(
        `/api/admin/notifications?page=${nextPage}&limit=${ADMIN_PAGE_SIZE}`
      );
      setDashboard((current) => ({ ...current, notifications }));
      setNotificationPage(nextPage);
      updateSectionStatus("notifications", { loading: false, error: null });
      return true;
    } catch (error) {
      reportError(error);
      const message = error instanceof Error ? error.message : "Request failed";
      updateSectionStatus("notifications", { loading: false, error: message });
      return false;
    }
  }

  async function refreshAll() {
    setMessage(null);
    const results = await Promise.all([
        loadMetricsAndSettings(),
        loadUsers(),
        loadJobs(),
        loadDisputes(),
        loadAudit(),
        loadNotifications()
      ]);
    setMessage(results.every(Boolean) ? "Dashboard refreshed from the admin API." : "Dashboard refreshed with section errors.");
    return results.every(Boolean);
  }

  async function mutate(path: string, init: RequestInit, refresh = true) {
    setBusy(path);
    setMessage(null);
    try {
      await apiJson(path, init);
      if (refresh) {
        const refreshed = await refreshAll();
        if (!refreshed) {
          setMessage("Action completed, but some sections failed to refresh.");
        } else {
          setMessage("Action completed successfully.");
        }
        return;
      }
      setMessage("Action completed successfully.");
    } catch (error) {
      reportError(error);
    } finally {
      setBusy(null);
    }
  }

  async function handleUserAction(userId: string, action: string) {
    await mutate(`/api/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ action })
    });
  }

  async function handleJobAction(jobId: string, action: string) {
    const prompted = action === "reject" || action === "escalate" ? window.prompt("Optional reason") : null;
    const reason = prompted && prompted.trim().length >= 3 ? prompted.trim() : undefined;
    await mutate(`/api/admin/jobs/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify({ action, reason })
    });
  }

  async function handleDisputeAction(disputeId: string, action: string) {
    const prompted = action === "escalate" ? window.prompt("Escalation reason") : null;
    const reason = prompted && prompted.trim().length >= 3 ? prompted.trim() : undefined;
    await mutate(`/api/admin/disputes/${disputeId}`, {
      method: "PATCH",
      body: JSON.stringify({ action, reason })
    });
  }

  async function handleSettingChange(setting: keyof AdminSettings, next: boolean) {
    await mutate("/api/admin/settings", {
      method: "PATCH",
      body: JSON.stringify({ [setting]: next })
    });
  }

  function submitUserFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(() => {
      void loadUsers(1, draftFilters);
    });
  }

  function submitAuditFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = draftAuditFilters;
    setAuditFilters(next);
    startTransition(() => {
      void loadAudit(1, next);
    });
  }

  function submitDisputeFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = draftDisputeFilters;
    setDisputeFilters(next);
    startTransition(() => {
      void loadDisputes(1, next);
    });
  }

  const previewCards =
    previewState === "ready" ? null : (
      <section className="card">
        <SectionTitle
          eyebrow="State preview"
          title="Loading, empty, and error handling"
          description="The admin view includes explicit states so reviewers can see how each section behaves when data is unavailable."
        />
        <div className="state-stack">
          {previewState === "loading" ? (
            <div className="state-card loading">Preview mode: loading state active.</div>
          ) : null}
          {previewState === "empty" ? (
            <div className="state-card empty">Preview mode: empty state active.</div>
          ) : null}
          {previewState === "error" ? (
            <div className="state-card error">Preview mode: error state active.</div>
          ) : null}
        </div>
      </section>
    );

  return (
    <section className="admin-shell">
      <header className="card admin-hero">
        <div>
          <span className="eyebrow">Admin Command Center</span>
          <h2>Platform control, moderation, and trust operations</h2>
          <p>
            This dashboard is connected to the admin API, supports server-side filtering and pagination, and includes
            live moderation actions.
          </p>
          <div className="hero-meta">
            <span className="pill">{dashboard.source === "api" ? "Live API data" : "Preview fallback"}</span>
            <span className="pill">Page size {ADMIN_PAGE_SIZE}</span>
          </div>
        </div>
        <div className="hero-actions">
          <button className="admin-button" type="button" onClick={() => void refreshAll()} disabled={isPending}>
            Refresh data
          </button>
          {message ? <p className="muted action-status">{message}</p> : null}
        </div>
      </header>

      {previewCards}

      <MetricsSection metrics={dashboard.metrics} status={sectionStatus.metrics} />
      <UsersSection
        users={dashboard.users}
        selectedUser={selectedUser}
        status={sectionStatus.users}
        filters={filters}
        draftFilters={draftFilters}
        setDraftFilters={setDraftFilters}
        onSubmit={submitUserFilters}
        onReset={() => {
          const next = defaultFilters();
          setDraftFilters(next);
          startTransition(() => {
            void loadUsers(1, next);
          });
        }}
        isPending={isPending}
        onPrev={() => {
          startTransition(() => {
            void loadUsers(Math.max(1, dashboard.users.page - 1), filters);
          });
        }}
        onNext={() => {
          startTransition(() => {
            void loadUsers(Math.min(dashboard.users.totalPages, dashboard.users.page + 1), filters);
          });
        }}
        onSelectUser={(userId) => setSelectedUserId(userId)}
        onUserAction={(userId, action) => void handleUserAction(userId, action)}
        busy={busy}
      />
      <section className="grid admin-columns" aria-label="Moderation and disputes">
        <ModerationSection
          jobs={dashboard.jobs}
          status={sectionStatus.jobs}
          onPrev={() => {
            startTransition(() => {
              void loadJobs(Math.max(1, dashboard.jobs.page - 1));
            });
          }}
          onNext={() => {
            startTransition(() => {
              void loadJobs(Math.min(dashboard.jobs.totalPages, dashboard.jobs.page + 1));
            });
          }}
          onJobAction={(jobId, action) => void handleJobAction(jobId, action)}
          busy={busy}
          isPending={isPending}
        />
        <DisputesSection
          disputes={dashboard.disputes}
          selectedDispute={selectedDispute}
          status={sectionStatus.disputes}
          draftFilters={draftDisputeFilters}
          setDraftDisputeFilters={setDraftDisputeFilters}
          onSubmit={submitDisputeFilters}
          onReset={() => {
            const next = defaultDisputeFilters();
            setDraftDisputeFilters(next);
            setDisputeFilters(next);
            startTransition(() => {
              void loadDisputes(1, next);
            });
          }}
          onPrev={() => {
            startTransition(() => {
              void loadDisputes(Math.max(1, dashboard.disputes.page - 1), disputeFilters);
            });
          }}
          onNext={() => {
            startTransition(() => {
              void loadDisputes(Math.min(dashboard.disputes.totalPages, dashboard.disputes.page + 1), disputeFilters);
            });
          }}
          onSelectDispute={(disputeId) => setSelectedDisputeId(disputeId)}
          onDisputeAction={(disputeId, action) => void handleDisputeAction(disputeId, action)}
          busy={busy}
          isPending={isPending}
        />
      </section>

      <section className="grid admin-columns">
        <PlatformControlsSection
          settings={dashboard.settings}
          status={sectionStatus.settings}
          onSettingChange={(setting, next) => void handleSettingChange(setting, next)}
          busy={busy}
        />
        <AuditLogSection
          auditLog={dashboard.auditLog}
          status={sectionStatus.auditLog}
          draftFilters={draftAuditFilters}
          setDraftAuditFilters={setDraftAuditFilters}
          onSubmit={submitAuditFilters}
          onReset={() => {
            const next = defaultAuditFilters();
            setDraftAuditFilters(next);
            setAuditFilters(next);
            startTransition(() => {
              void loadAudit(1, next);
            });
          }}
          onPrev={() => {
            startTransition(() => {
              void loadAudit(Math.max(1, dashboard.auditLog.page - 1), auditFilters);
            });
          }}
          onNext={() => {
            startTransition(() => {
              void loadAudit(Math.min(dashboard.auditLog.totalPages, dashboard.auditLog.page + 1), auditFilters);
            });
          }}
          isPending={isPending}
        />
        <NotificationsSection
          notifications={dashboard.notifications}
          status={sectionStatus.notifications}
          onPrev={() => {
            startTransition(() => {
              void loadNotifications(Math.max(1, dashboard.notifications.page - 1));
            });
          }}
          onNext={() => {
            startTransition(() => {
              void loadNotifications(Math.min(dashboard.notifications.totalPages, dashboard.notifications.page + 1));
            });
          }}
        />
      </section>
    </section>
  );
}
