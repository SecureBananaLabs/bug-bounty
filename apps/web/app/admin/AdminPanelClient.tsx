"use client";

import { useMemo, useState } from "react";
import type { AdminDashboardData, AuditLogEntry } from "../../lib/adminTypes";
import { AuditLog } from "./components/AuditLog";
import { DisputeQueue } from "./components/DisputeQueue";
import { ModerationQueue } from "./components/ModerationQueue";
import { PlatformControls } from "./components/PlatformControls";
import { SummaryCards } from "./components/SummaryCards";
import { TrustMetrics } from "./components/TrustMetrics";
import { UserManagementTable } from "./components/UserManagementTable";

type Props = {
  initialData: AdminDashboardData;
};

function createAuditEntry(actionType: string, targetId: string, detail: string): AuditLogEntry {
  return {
    id: `audit_${Date.now()}`,
    adminId: "usr_admin_1",
    actionType,
    targetType: "admin-panel",
    targetId,
    detail,
    createdAt: new Date().toISOString()
  };
}

export function AdminPanelClient({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date().toLocaleString("en-US"));

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.users.filter((user) => {
      const matchesSearch =
        !query ||
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [data.users, roleFilter, search, statusFilter]);

  function appendAudit(entry: AuditLogEntry) {
    setData((current) => ({
      ...current,
      auditLog: [entry, ...current.auditLog].slice(0, 12)
    }));
  }

  function handleRefresh() {
    setIsRefreshing(true);
    window.setTimeout(() => {
      setLastRefresh(new Date().toLocaleString("en-US"));
      setIsRefreshing(false);
      appendAudit(createAuditEntry("dashboard.refresh", "overview", "Manual data refresh"));
    }, 350);
  }

  function handleUserStatusAction(userId: string, action: "suspend" | "reinstate" | "ban") {
    const nextStatus = action === "reinstate" ? "active" : action === "suspend" ? "suspended" : "banned";
    setData((current) => ({
      ...current,
      users: current.users.map((user) => (user.id === userId ? { ...user, status: nextStatus } : user))
    }));
    appendAudit(createAuditEntry(`user.${action}`, userId, `User ${action} action applied`));
  }

  function handleModerationDecision(listingId: string, decision: "approve" | "reject" | "escalate") {
    const nextStatus = decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "escalated";
    setData((current) => ({
      ...current,
      flaggedListings: current.flaggedListings.map((listing) =>
        listing.id === listingId ? { ...listing, status: nextStatus } : listing
      )
    }));
    appendAudit(createAuditEntry(`listing.${decision}`, listingId, `Listing marked ${nextStatus}`));
  }

  function handleDisputeRuling(
    disputeId: string,
    ruling: "favor_client" | "favor_freelancer" | "refund" | "escalate"
  ) {
    setData((current) => ({
      ...current,
      disputes: current.disputes.map((dispute) =>
        dispute.id === disputeId
          ? { ...dispute, status: ruling === "escalate" ? "escalated" : "resolved" }
          : dispute
      )
    }));
    appendAudit(createAuditEntry(`dispute.${ruling}`, disputeId, "Dispute ruling applied"));
  }

  function handleControlToggle(key: "registrationsEnabled" | "jobPostingsEnabled") {
    const label = key === "registrationsEnabled" ? "new registrations" : "new job postings";
    if (!window.confirm(`Apply platform control change for ${label}?`)) return;

    setData((current) => ({
      ...current,
      controls: {
        ...current.controls,
        [key]: !current.controls[key]
      }
    }));
    appendAudit(createAuditEntry(`platform.${key}`, key, `Toggled ${label}`));
  }

  return (
    <div className="admin-panel">
      <div className="admin-skip-links">
        <a href="#admin-users">Skip to users</a>
        <a href="#admin-moderation">Skip to moderation</a>
        <a href="#admin-controls">Skip to controls</a>
      </div>

      <section className="admin-toolbar" aria-label="Admin dashboard controls">
        <div>
          <p className="admin-eyebrow">Admin panel</p>
          <h2>Operations dashboard</h2>
          <span>Last refresh: {lastRefresh}</span>
        </div>
        <button type="button" onClick={handleRefresh} disabled={isRefreshing} aria-label="Refresh admin dashboard">
          {isRefreshing ? "Refreshing" : "Refresh"}
        </button>
      </section>

      <SummaryCards metrics={data.metrics} />

      <div className="admin-two-column">
        <TrustMetrics distribution={data.trustDistribution} />
        <PlatformControls controls={data.controls} onToggle={handleControlToggle} />
      </div>

      <UserManagementTable
        users={filteredUsers}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        search={search}
        onRoleFilterChange={setRoleFilter}
        onStatusFilterChange={setStatusFilter}
        onSearchChange={setSearch}
        onStatusAction={handleUserStatusAction}
      />

      <div className="admin-two-column">
        <ModerationQueue
          listings={data.flaggedListings.filter((listing) => listing.status === "flagged")}
          onDecision={handleModerationDecision}
        />
        <DisputeQueue
          disputes={data.disputes.filter((dispute) => dispute.status !== "resolved")}
          onRuling={handleDisputeRuling}
        />
      </div>

      <AuditLog entries={data.auditLog} />
    </div>
  );
}
