"use client";
import { useState } from "react";
import { api, type DisputeRecord, type PaginatedResult } from "../../../lib/api";
import { ServerTable, type Column } from "../ServerTable";

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  under_review: "Under Review",
  resolved: "Resolved",
  escalated: "Escalated",
};

/** Dispute resolution queue. */
export function DisputesSection() {
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DisputeRecord | null>(null);

  const fetchDisputes = (page: number, pageSize: number) =>
    api.disputes({ status: statusFilter, search, page, pageSize });

  const columns: Column<DisputeRecord>[] = [
    { key: "id", header: "ID" },
    {
      key: "status",
      header: "Status",
      render: (d) => STATUS_LABELS[d.status] ?? d.status,
    },
    { key: "amount", header: "Amount ($)", render: (d) => `$${d.amount}` },
    { key: "jobId", header: "Job" },
    {
      key: "createdAt",
      header: "Created",
      render: (d) => new Date(d.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (d) => (
        <button onClick={() => setSelected(d)} aria-label={`View dispute ${d.id}`}>
          Review
        </button>
      ),
    },
  ];

  return (
    <section aria-label="Dispute resolution">
      <h2>Disputes</h2>

      <div className="filter-bar" role="search" aria-label="Filter disputes">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
          <option value="escalated">Escalated</option>
        </select>
        <input
          type="search"
          placeholder="Search thread…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search disputes"
        />
      </div>

      <ServerTable<DisputeRecord>
        columns={columns}
        fetchPage={(page, size) => fetchDisputes(page, size)}
        initialPageSize={10}
      />

      {selected && (
        <DisputeModal
          dispute={selected}
          onClose={() => setSelected(null)}
          onResolved={() => setSelected(null)}
        />
      )}
    </section>
  );
}

function DisputeModal({
  dispute,
  onClose,
  onResolved,
}: {
  dispute: DisputeRecord;
  onClose: () => void;
  onResolved: () => void;
}) {
  const [acting, setActing] = useState<string | null>(null);

  const resolve = async (ruling: "freelancer" | "client" | "escalate") => {
    setActing(ruling);
    try {
      await api.resolveDispute(dispute.id, ruling, { refund: ruling !== "escalate", reason: "resolved from admin panel" });
      onResolved();
      onClose();
    } catch (e: any) {
      console.error(e);
    } finally {
      setActing(null);
    }
  };

  return (
    <div
      className="confirm-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Dispute ${dispute.id}`}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="card" style={{ maxWidth: "700px", width: "90%" }}>
        <button onClick={onClose} aria-label="Close" style={{ float: "right" }}>
          ×
        </button>
        <h3>Dispute {dispute.id}</h3>

        <p>
          <strong>Status:</strong> {STATUS_LABELS[dispute.status] ?? dispute.status}
        </p>
        <p>
          <strong>Amount:</strong> ${dispute.amount}
        </p>
        <p>
          <strong>Job ID:</strong> {dispute.jobId}
        </p>
        <p>
          <strong>Freelancer:</strong> {dispute.freelancerId}
        </p>
        <p>
          <strong>Client:</strong> {dispute.clientId}
        </p>

        <h4>Thread</h4>
        <ul>
          {dispute.thread.map((t, i) => (
            <li key={i}>
              <strong>{t.authorId}</strong>: {t.body} <span style={{ color: "#8a93b8" }}>({new Date(t.createdAt).toLocaleString()})</span>
            </li>
          ))}
        </ul>

        <h4>Evidence ({dispute.evidence.length})</h4>
        <ul>
          {dispute.evidence.map((e, i) => (
            <li key={i}>
              {e.type}: {e.url} — {e.label}
            </li>
          ))}
        </ul>

        <h4>Resolution</h4>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            onClick={() => resolve("freelancer")}
            disabled={acting === "freelancer"}
            aria-label="Rule in favour of freelancer"
            style={{ background: "#2f855a", color: "#fff" }}
          >
            {acting === "freelancer" ? "Refunding…" : "Ruling: Freelancer"}
          </button>
          <button
            onClick={() => resolve("client")}
            disabled={acting === "client"}
            aria-label="Rule in favour of client"
            style={{ background: "#2f855a", color: "#fff" }}
          >
            {acting === "client" ? "Refunding…" : "Ruling: Client"}
          </button>
          <button
            onClick={() => resolve("escalate")}
            disabled={acting === "escalate"}
            aria-label="Escalate to senior admin"
            style={{ background: "#b7791c", color: "#fff" }}
          >
            {acting === "escalate" ? "Escalating…" : "Escalate"}
          </button>
        </div>
      </div>
    </div>
  );
}
