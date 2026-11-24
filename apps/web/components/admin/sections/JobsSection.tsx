"use client";
import { useState } from "react";
import { api, type JobRecord } from "../../../lib/api";
import { ServerTable, type Column } from "../ServerTable";
import { ConfirmDialog } from "../ConfirmDialog";

/** Moderation queue: jobs flagged by automated rules or user reports. */
export function JobsSection() {
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<JobRecord | null>(null);

  const fetchFlagged = (page: number, pageSize: number) =>
    api.flaggedJobs({ search, page, pageSize });

  const columns: Column<JobRecord>[] = [
    { key: "id", header: "ID" },
    { key: "title", header: "Title" },
    { key: "status", header: "Status" },
    { key: "clientId", header: "Posted by" },
    { key: "flagReason", header: "Flag reason" },
    {
      key: "actions",
      header: "Actions",
      render: (j) => <JobActions job={j} onModerated={() => setSelectedJob(null)} onDetail={() => setSelectedJob(j)} />,
    },
  ];

  return (
    <section aria-label="Job moderation">
      <h2>Moderation Queue</h2>
      <div className="filter-bar" role="search" aria-label="Search flagged jobs">
        <input
          type="search"
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search flagged jobs"
        />
      </div>

      <ServerTable<JobRecord>
        columns={columns}
        fetchPage={(page, size) => fetchFlagged(page, size)}
        initialPageSize={10}
      />

      {selectedJob && (
        <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} onModerated={() => setSelectedJob(null)} />
      )}
    </section>
  );
}

function JobActions({
  job,
  onModerated,
  onDetail,
}: {
  job: JobRecord;
  onModerated: () => void;
  onDetail: () => void;
}) {
  const applyDecision = async (decision: "approve" | "reject" | "escalate") => {
    try {
      await api.moderateJob(job.id, decision, `moderated from panel (${decision})`);
      onModerated();
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
      <button onClick={onDetail} aria-label={`View ${job.title} details`}>
        Details
      </button>
      <ConfirmDialog
        title="Approve listing"
        message={`Approve "${job.title}" and remove it from the moderation queue?`}
        confirmLabel="Approve"
        onConfirm={() => applyDecision("approve")}
      >
        <button aria-label={`Approve ${job.title}`} style={{ background: "#2f855a", color: "#fff" }}>
          Approve
        </button>
      </ConfirmDialog>
      <ConfirmDialog
        title="Reject listing"
        message={`Reject "${job.title}"? The posting user will be notified with the reason.`}
        confirmLabel="Reject"
        onConfirm={() => applyDecision("reject")}
      >
        <button aria-label={`Reject ${job.title}`} style={{ background: "#c53030", color: "#fff" }}>
          Reject
        </button>
      </ConfirmDialog>
      <ConfirmDialog
        title="Escalate listing"
        message={`Escalate "${job.title}" to a senior admin?`}
        confirmLabel="Escalate"
        onConfirm={() => applyDecision("escalate")}
      >
        <button aria-label={`Escalate ${job.title}`} style={{ background: "#b7791c", color: "#fff" }}>
          Escalate
        </button>
      </ConfirmDialog>
    </div>
  );
}

function JobDetailModal({ job, onClose, onModerated }: { job: JobRecord; onClose: () => void; onModerated: () => void }) {
  const applyDecision = async (decision: "approve" | "reject" | "escalate") => {
    try {
      await api.moderateJob(job.id, decision, `moderated via detail modal (${decision})`);
      onModerated();
      onClose();
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <div
      className="confirm-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Job ${job.id} details`}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="card" style={{ maxWidth: "600px", width: "90%" }}>
        <button onClick={onClose} aria-label="Close" style={{ float: "right" }}>
          ×
        </button>
        <h3>{job.title}</h3>
        <p>
          <strong>ID:</strong> {job.id}
        </p>
        <p>
          <strong>Status:</strong> {job.status}
        </p>
        <p>
          <strong>Posted by:</strong> {job.clientId}
        </p>
        <p>
          <strong>Flag reason:</strong> {job.flagReason ?? "unspecified"}
        </p>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <button onClick={() => applyDecision("approve")} style={{ background: "#2f855a", color: "#fff" }}>
            Approve
          </button>
          <button onClick={() => applyDecision("reject")} style={{ background: "#c53030", color: "#fff" }}>
            Reject
          </button>
          <button onClick={() => applyDecision("escalate")} style={{ background: "#b7791c", color: "#fff" }}>
            Escalate
          </button>
        </div>
      </div>
    </div>
  );
}
