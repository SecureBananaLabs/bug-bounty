"use client";
import { useState, useEffect } from "react";
import { api, type AuditEntry, type PaginatedResult } from "../../../lib/api";
import { ServerTable, type Column } from "../ServerTable";

/** Audit Log: append-only record of all admin actions.
Filterable by admin, action type, and date range. Server-side paginated. */
export function AuditLogSection() {
  const [filters, setFilters] = useState({
    admin: "",
    action: "",
    from: "",
    to: "",
  });

  const fetchAudit = (page: number, pageSize: number) =>
    api.audit({ ...filters, page, pageSize });

  const columns: Column<AuditEntry>[] = [
    { key: "id", header: "ID" },
    { key: "adminId", header: "Admin" },
    { key: "action", header: "Action" },
    { key: "target", header: "Target" },
    {
      key: "createdAt",
      header: "Timestamp",
      render: (a) => new Date(a.createdAt).toLocaleString(),
    },
    {
      key: "meta",
      header: "Details",
      render: (a) => JSON.stringify(a.meta ?? {}),
    },
  ];

  return (
    <section aria-label="Audit log">
      <h2>Audit Log</h2>

      <div className="filter-bar" aria-label="Filter audit log">
        <input
          type="text"
          placeholder="Admin ID…"
          value={filters.admin}
          onChange={(e) => setFilters((f) => ({ ...f, admin: e.target.value }))}
          aria-label="Filter by admin"
        />
        <input
          type="text"
          placeholder="Action type…"
          value={filters.action}
          onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
          aria-label="Filter by action"
        />
        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          aria-label="From date"
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          aria-label="To date"
        />
      </div>

      {/* key forces ServerTable to re-fetch when filters change */}
      <ServerTable<AuditEntry>
        key={JSON.stringify(filters)}
        columns={columns}
        fetchPage={(page, size) => fetchAudit(page, size)}
        initialPageSize={20}
      />
    </section>
  );
}
