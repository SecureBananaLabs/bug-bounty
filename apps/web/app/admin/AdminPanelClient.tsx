"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchAuditLogs,
  fetchControls,
  fetchDisputeDetail,
  fetchDisputes,
  fetchMetrics,
  fetchModeration,
  fetchUserDetail,
  fetchUsers,
  hasAdminApiConfig,
  patchControl,
  patchDisputeRuling,
  patchModeration,
  patchUserStatus
} from "./adminApi";
import { AuditSection } from "./components/AuditSection";
import { ControlsSection } from "./components/ControlsSection";
import { DisputesSection } from "./components/DisputesSection";
import { MetricsGrid } from "./components/MetricsGrid";
import { ModerationSection } from "./components/ModerationSection";
import { TrustAndSourceSection } from "./components/TrustAndSourceSection";
import { UsersSection } from "./components/UsersSection";
import { createDemoStore, disputeSummary, type DemoStore } from "./demoData";
import type {
  AuditFilters,
  AuditLog,
  Control,
  Dispute,
  DisputeDetail,
  Listing,
  MetricState,
  Page,
  User,
  UserDetail,
  UserFilters,
  UserStatus
} from "./types";

const usersPageSize = 4;
const queuePageSize = 3;
const auditPageSize = 8;

const emptyPagination = {
  page: 1,
  pageSize: usersPageSize,
  totalItems: 0,
  totalPages: 1
};

const defaultUserFilters: UserFilters = {
  search: "",
  role: "all",
  status: "all",
  joinedFrom: "",
  joinedTo: ""
};

const defaultAuditFilters: AuditFilters = {
  actionType: "all",
  admin: "",
  from: "",
  to: ""
};

function emptyPage<T>(pageSize: number): Page<T> {
  return { items: [], pagination: { ...emptyPagination, pageSize } };
}

function paginateLocal<T>(items: T[], page: number, pageSize: number): Page<T> {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    pagination: {
      page: safePage,
      pageSize,
      totalItems,
      totalPages
    }
  };
}

function dateOnOrAfter(value: string, from: string) {
  return !from || new Date(value) >= new Date(from);
}

function dateOnOrBefore(value: string, to: string) {
  return !to || new Date(value) <= new Date(to);
}

function filterUsers(users: User[], filters: UserFilters) {
  const needle = filters.search.trim().toLowerCase();
  return users
    .filter((user) => {
      const matchesSearch =
        !needle ||
        [user.fullName, user.email, user.location].some((value) => value.toLowerCase().includes(needle));
      const matchesRole = filters.role === "all" || user.role === filters.role;
      const matchesStatus = filters.status === "all" || user.status === filters.status;
      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus &&
        dateOnOrAfter(user.joinedAt, filters.joinedFrom) &&
        dateOnOrBefore(user.joinedAt, filters.joinedTo)
      );
    })
    .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
}

function filterAudit(logs: AuditLog[], filters: AuditFilters) {
  return logs.filter((log) => {
    const matchesAction = filters.actionType === "all" || log.actionType === filters.actionType;
    const matchesAdmin = !filters.admin || log.adminId.includes(filters.admin);
    return (
      matchesAction &&
      matchesAdmin &&
      dateOnOrAfter(log.createdAt, filters.from) &&
      dateOnOrBefore(log.createdAt, filters.to)
    );
  });
}

function localUserDetail(store: DemoStore, id: string): UserDetail | null {
  const profile = store.users.find((user) => user.id === id);
  if (!profile) {
    return null;
  }

  return {
    profile,
    activeJobs: store.listings.filter((listing) => listing.clientId === id || listing.id === id),
    disputeHistory: store.disputes
      .filter((dispute) => dispute.clientId === id || dispute.freelancerId === id)
      .map(disputeSummary)
  };
}

function appendLocalAudit(store: DemoStore, actionType: string, targetType: string, targetId: string, summary: string) {
  store.auditLogs.unshift({
    id: `audit_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    adminId: "admin_demo",
    actionType,
    targetType,
    targetId,
    summary,
    createdAt: new Date().toISOString()
  });
}

function recomputeDemoMetrics(store: DemoStore): MetricState {
  return {
    ...store.metrics,
    totalUsers: store.users.length,
    flaggedListings: store.listings.filter((listing) => listing.moderationStatus === "flagged").length,
    openDisputes: store.disputes.filter((dispute) => dispute.status === "open").length,
    trustScoreDistribution: [
      { label: "0-49", count: store.users.filter((user) => user.trustScore < 50).length },
      {
        label: "50-79",
        count: store.users.filter((user) => user.trustScore >= 50 && user.trustScore < 80).length
      },
      { label: "80-100", count: store.users.filter((user) => user.trustScore >= 80).length }
    ]
  };
}

function reasonFor(label: string) {
  const value = window.prompt(label);
  return value?.trim() ?? "";
}

export function AdminPanelClient() {
  const demoStoreRef = useRef<DemoStore>(createDemoStore());
  const [dataSource, setDataSource] = useState<"api" | "demo">("demo");
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState("");
  const [metrics, setMetrics] = useState<MetricState>(() => recomputeDemoMetrics(demoStoreRef.current));
  const [userFilters, setUserFilters] = useState<UserFilters>(defaultUserFilters);
  const [users, setUsers] = useState<Page<User>>(() =>
    paginateLocal(filterUsers(demoStoreRef.current.users, defaultUserFilters), 1, usersPageSize)
  );
  const [selectedUserId, setSelectedUserId] = useState("usr_freelancer_1");
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(() =>
    localUserDetail(demoStoreRef.current, "usr_freelancer_1")
  );
  const [moderationStatus, setModerationStatus] = useState("flagged");
  const [listings, setListings] = useState<Page<Listing>>(() =>
    paginateLocal(
      demoStoreRef.current.listings.filter((listing) => listing.moderationStatus === "flagged"),
      1,
      queuePageSize
    )
  );
  const [disputeStatus, setDisputeStatus] = useState("open");
  const [disputes, setDisputes] = useState<Page<Dispute>>(() =>
    paginateLocal(
      demoStoreRef.current.disputes
        .filter((dispute) => dispute.status === "open")
        .map(disputeSummary),
      1,
      queuePageSize
    )
  );
  const [selectedDisputeId, setSelectedDisputeId] = useState("dispute_1");
  const [selectedDispute, setSelectedDispute] = useState<DisputeDetail | null>(() => demoStoreRef.current.disputes[0]);
  const [controls, setControls] = useState<Record<string, Control>>(() => demoStoreRef.current.controls);
  const [auditFilters, setAuditFilters] = useState<AuditFilters>(defaultAuditFilters);
  const [auditLogs, setAuditLogs] = useState<Page<AuditLog>>(() =>
    paginateLocal(filterAudit(demoStoreRef.current.auditLogs, defaultAuditFilters), 1, auditPageSize)
  );

  const auditActionTypes = useMemo(() => {
    const source = dataSource === "api" ? auditLogs.items : demoStoreRef.current.auditLogs;
    return Array.from(new Set(source.map((log) => log.actionType))).sort();
  }, [auditLogs.items, dataSource]);

  const apiAvailable = useCallback(() => hasAdminApiConfig(), []);

  const loadMetrics = useCallback(async () => {
    if (apiAvailable()) {
      setMetrics(await fetchMetrics());
      setDataSource("api");
      return;
    }

    const store = demoStoreRef.current;
    setMetrics(recomputeDemoMetrics(store));
    setDataSource("demo");
  }, [apiAvailable]);

  const loadControls = useCallback(async () => {
    if (apiAvailable()) {
      setControls(await fetchControls());
      setDataSource("api");
      return;
    }

    setControls({ ...demoStoreRef.current.controls });
    setDataSource("demo");
  }, [apiAvailable]);

  const loadUsers = useCallback(
    async (filters = userFilters, page = users.pagination.page) => {
      if (apiAvailable()) {
        const nextUsers = await fetchUsers(filters, page, usersPageSize);
        setUsers(nextUsers);
        setDataSource("api");
        const nextSelectedId =
          nextUsers.items.some((user) => user.id === selectedUserId) || !nextUsers.items[0]
            ? selectedUserId
            : nextUsers.items[0].id;
        if (nextSelectedId) {
          setSelectedUserId(nextSelectedId);
          setSelectedUser(await fetchUserDetail(nextSelectedId));
        } else {
          setSelectedUser(null);
        }
        return;
      }

      const nextUsers = paginateLocal(filterUsers(demoStoreRef.current.users, filters), page, usersPageSize);
      setUsers(nextUsers);
      setDataSource("demo");
      const nextSelectedId =
        nextUsers.items.some((user) => user.id === selectedUserId) || !nextUsers.items[0]
          ? selectedUserId
          : nextUsers.items[0].id;
      setSelectedUserId(nextSelectedId);
      setSelectedUser(nextSelectedId ? localUserDetail(demoStoreRef.current, nextSelectedId) : null);
    },
    [apiAvailable, selectedUserId, userFilters, users.pagination.page]
  );

  const loadUserDetail = useCallback(
    async (id: string) => {
      setSelectedUserId(id);
      if (apiAvailable()) {
        setSelectedUser(await fetchUserDetail(id));
        setDataSource("api");
        return;
      }
      setSelectedUser(localUserDetail(demoStoreRef.current, id));
      setDataSource("demo");
    },
    [apiAvailable]
  );

  const loadModeration = useCallback(
    async (status = moderationStatus, page = listings.pagination.page) => {
      if (apiAvailable()) {
        setListings(await fetchModeration(status, page, queuePageSize));
        setDataSource("api");
        return;
      }

      setListings(
        paginateLocal(
          demoStoreRef.current.listings.filter((listing) => listing.moderationStatus === status),
          page,
          queuePageSize
        )
      );
      setDataSource("demo");
    },
    [apiAvailable, listings.pagination.page, moderationStatus]
  );

  const loadDisputes = useCallback(
    async (status = disputeStatus, page = disputes.pagination.page) => {
      if (apiAvailable()) {
        const nextDisputes = await fetchDisputes(status, page, queuePageSize);
        setDisputes(nextDisputes);
        setDataSource("api");
        const nextSelectedId =
          nextDisputes.items.some((dispute) => dispute.id === selectedDisputeId) || !nextDisputes.items[0]
            ? selectedDisputeId
            : nextDisputes.items[0].id;
        if (nextSelectedId) {
          setSelectedDisputeId(nextSelectedId);
          setSelectedDispute(await fetchDisputeDetail(nextSelectedId));
        } else {
          setSelectedDispute(null);
        }
        return;
      }

      const nextDisputes = paginateLocal(
        demoStoreRef.current.disputes
          .filter((dispute) => dispute.status === status)
          .map(disputeSummary),
        page,
        queuePageSize
      );
      setDisputes(nextDisputes);
      setDataSource("demo");
      const nextSelectedId =
        nextDisputes.items.some((dispute) => dispute.id === selectedDisputeId) || !nextDisputes.items[0]
          ? selectedDisputeId
          : nextDisputes.items[0].id;
      setSelectedDisputeId(nextSelectedId);
      setSelectedDispute(demoStoreRef.current.disputes.find((dispute) => dispute.id === nextSelectedId) ?? null);
    },
    [apiAvailable, disputeStatus, disputes.pagination.page, selectedDisputeId]
  );

  const loadDisputeDetail = useCallback(
    async (id: string) => {
      setSelectedDisputeId(id);
      if (apiAvailable()) {
        setSelectedDispute(await fetchDisputeDetail(id));
        setDataSource("api");
        return;
      }
      setSelectedDispute(demoStoreRef.current.disputes.find((dispute) => dispute.id === id) ?? null);
      setDataSource("demo");
    },
    [apiAvailable]
  );

  const loadAudit = useCallback(
    async (filters = auditFilters, page = auditLogs.pagination.page) => {
      if (apiAvailable()) {
        setAuditLogs(await fetchAuditLogs(filters, page, auditPageSize));
        setDataSource("api");
        return;
      }

      setAuditLogs(paginateLocal(filterAudit(demoStoreRef.current.auditLogs, filters), page, auditPageSize));
      setDataSource("demo");
    },
    [apiAvailable, auditFilters, auditLogs.pagination.page]
  );

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([loadMetrics(), loadControls()]);
      await Promise.all([loadUsers(userFilters, users.pagination.page), loadModeration(), loadDisputes(), loadAudit()]);
      setLastRefresh(new Date().toISOString());
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Admin data refresh failed");
    } finally {
      setLoading(false);
    }
  }, [loadAudit, loadControls, loadDisputes, loadMetrics, loadModeration, loadUsers, userFilters, users.pagination.page]);

  useEffect(() => {
    refreshAll();
  }, []);

  async function runMutation(label: string, operation: () => Promise<void>) {
    setBusyAction(label);
    setError("");
    try {
      await operation();
      await Promise.all([loadMetrics(), loadAudit(defaultAuditFilters, 1)]);
      setAuditFilters(defaultAuditFilters);
      setLastRefresh(new Date().toISOString());
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : `${label} failed`);
    } finally {
      setBusyAction("");
    }
  }

  function handleUserFilterChange(nextFilters: UserFilters) {
    setUserFilters(nextFilters);
    loadUsers(nextFilters, 1).catch((loadError) =>
      setError(loadError instanceof Error ? loadError.message : "User reload failed")
    );
  }

  function handleAuditFilterChange(nextFilters: AuditFilters) {
    setAuditFilters(nextFilters);
    loadAudit(nextFilters, 1).catch((loadError) =>
      setError(loadError instanceof Error ? loadError.message : "Audit reload failed")
    );
  }

  function handleModerationStatusChange(status: string) {
    setModerationStatus(status);
    loadModeration(status, 1).catch((loadError) =>
      setError(loadError instanceof Error ? loadError.message : "Moderation reload failed")
    );
  }

  function handleDisputeStatusChange(status: string) {
    setDisputeStatus(status);
    loadDisputes(status, 1).catch((loadError) =>
      setError(loadError instanceof Error ? loadError.message : "Dispute reload failed")
    );
  }

  function handleUserStatus(userId: string, status: UserStatus) {
    const reason = reasonFor(`Reason for changing this user to ${status}`);
    if (!reason) {
      return;
    }

    runMutation("Updating user status", async () => {
      if (apiAvailable()) {
        await patchUserStatus(userId, status, reason);
      } else {
        const user = demoStoreRef.current.users.find((candidate) => candidate.id === userId);
        if (user) {
          const previousStatus = user.status;
          user.status = status;
          appendLocalAudit(
            demoStoreRef.current,
            "user_status",
            "user",
            userId,
            `${user.fullName} changed from ${previousStatus} to ${status}`
          );
        }
      }
      await loadUsers(userFilters, users.pagination.page);
      if (selectedUserId === userId) {
        await loadUserDetail(userId);
      }
    });
  }

  function handleModerationDecision(id: string, decision: "approve" | "reject" | "escalate") {
    const reason = reasonFor(`Reason for ${decision} decision`);
    if (!reason) {
      return;
    }

    runMutation("Updating listing moderation", async () => {
      if (apiAvailable()) {
        await patchModeration(id, decision, reason);
      } else {
        const listing = demoStoreRef.current.listings.find((candidate) => candidate.id === id);
        if (listing) {
          const previousStatus = listing.moderationStatus;
          listing.moderationStatus =
            decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "escalated";
          appendLocalAudit(
            demoStoreRef.current,
            "listing_moderation",
            "job",
            id,
            `${listing.title} moderation changed from ${previousStatus} to ${listing.moderationStatus}`
          );
        }
      }
      await loadModeration(moderationStatus, listings.pagination.page);
    });
  }

  function handleDisputeRuling(id: string, ruling: "client" | "freelancer" | "escalate") {
    const notes = reasonFor(`Resolution notes for ${ruling} ruling`);
    if (!notes) {
      return;
    }

    runMutation("Issuing dispute ruling", async () => {
      if (apiAvailable()) {
        await patchDisputeRuling(id, ruling, notes, ruling === "client");
      } else {
        const dispute = demoStoreRef.current.disputes.find((candidate) => candidate.id === id);
        if (dispute) {
          const previousStatus = dispute.status;
          dispute.ruling = ruling;
          dispute.status = ruling === "escalate" ? "escalated" : "resolved";
          dispute.refundTriggered = ruling === "client";
          appendLocalAudit(
            demoStoreRef.current,
            "dispute_ruling",
            "dispute",
            id,
            `Dispute ${id} moved from ${previousStatus} to ${dispute.status}`
          );
        }
      }
      await loadDisputes(disputeStatus, disputes.pagination.page);
      await loadDisputeDetail(id);
    });
  }

  function handleControlToggle(key: string, enabled: boolean) {
    const control = controls[key];
    if (!control || !window.confirm(`Confirm change for ${control.label}?`)) {
      return;
    }

    runMutation("Updating platform control", async () => {
      if (apiAvailable()) {
        await patchControl(key, enabled);
      } else {
        demoStoreRef.current.controls[key] = {
          ...demoStoreRef.current.controls[key],
          enabled,
          updatedAt: new Date().toISOString(),
          updatedBy: "admin_demo"
        };
        appendLocalAudit(demoStoreRef.current, "control_update", "platform_control", key, `${control.label} toggled`);
      }
      await loadControls();
    });
  }

  return (
    <section className="admin-shell" aria-labelledby="admin-title">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h2 id="admin-title">Admin Panel</h2>
        </div>
        <div className="admin-header-actions">
          <span className="refresh-stamp">{lastRefresh ? `Refreshed ${lastRefresh}` : "Loading"}</span>
          <button type="button" className="button primary" onClick={refreshAll} disabled={loading || busyAction !== ""}>
            Refresh
          </button>
        </div>
      </div>

      {error ? <div className="error-banner" role="alert">{error}</div> : null}
      {busyAction ? <div className="busy-banner" aria-live="polite">{busyAction}</div> : null}

      <MetricsGrid metrics={metrics} loading={loading} />

      <UsersSection
        users={users}
        filters={userFilters}
        selectedUser={selectedUser}
        busyAction={busyAction}
        onFilterChange={handleUserFilterChange}
        onPageChange={(page) => loadUsers(userFilters, page).catch((loadError) => setError(String(loadError)))}
        onSelectUser={(id) => loadUserDetail(id).catch((loadError) => setError(String(loadError)))}
        onStatusChange={handleUserStatus}
      />

      <ModerationSection
        listings={listings}
        status={moderationStatus}
        busyAction={busyAction}
        onStatusChange={handleModerationStatusChange}
        onPageChange={(page) => loadModeration(moderationStatus, page).catch((loadError) => setError(String(loadError)))}
        onDecision={handleModerationDecision}
      />

      <DisputesSection
        disputes={disputes}
        status={disputeStatus}
        selectedDispute={selectedDispute}
        busyAction={busyAction}
        onStatusChange={handleDisputeStatusChange}
        onPageChange={(page) => loadDisputes(disputeStatus, page).catch((loadError) => setError(String(loadError)))}
        onSelectDispute={(id) => loadDisputeDetail(id).catch((loadError) => setError(String(loadError)))}
        onRule={handleDisputeRuling}
      />

      <div className="admin-two-column">
        <TrustAndSourceSection metrics={metrics} dataSource={dataSource} />
        <ControlsSection controls={controls} busyAction={busyAction} onToggle={handleControlToggle} />
      </div>

      <AuditSection
        auditLogs={auditLogs}
        filters={auditFilters}
        actionTypes={auditActionTypes}
        onFilterChange={handleAuditFilterChange}
        onPageChange={(page) => loadAudit(auditFilters, page).catch((loadError) => setError(String(loadError)))}
      />
    </section>
  );
}
