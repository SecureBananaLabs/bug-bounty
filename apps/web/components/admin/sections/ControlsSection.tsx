"use client";
import { useState, useEffect } from "react";
import { api, type PlatformControls, type AuditEntry } from "../../../lib/api";
import { ConfirmDialog } from "../ConfirmDialog";

/** Platform Controls: toggle registrations / job postings.

Each toggle is gated behind a confirmation dialog and the change is logged
server-side via the audit log (with the admin's verified sub + timestamp). */
export function ControlsSection() {
  const [controls, setControls] = useState<PlatformControls | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setControls(await api.controls());
    } catch (e: any) {
      setError(e?.message ?? "Failed to load controls");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (field: keyof PlatformControls) => {
    if (!controls) return;
    const next = { ...controls, [field]: !controls[field] };
    try {
      setControls(await api.setControls(next));
    } catch (e: any) {
      setError(e?.message ?? "Failed to update controls");
    }
  };

  if (loading) return <div className="card" aria-label="Loading">Loading controls…</div>;
  if (error) return <div className="card" role="alert" aria-label="Error">Error: {error}</div>;
  if (!controls) return null;

  return (
    <section aria-label="Platform controls">
      <h2>Platform Controls</h2>

      <div className="card">
        <ToggleRow
          label="New user registrations"
          enabled={controls.registrationsEnabled}
          onChange={() => toggle("registrationsEnabled")}
          confirmTitle="Disable registrations?"
          confirmMessage="New users will be unable to register until this is re-enabled."
        />
        <ToggleRow
          label="New job postings"
          enabled={controls.jobPostingsEnabled}
          onChange={() => toggle("jobPostingsEnabled")}
          confirmTitle="Disable job postings?"
          confirmMessage="Clients will be unable to post new jobs until this is re-enabled."
        />
      </div>
    </section>
  );
}

function ToggleRow({
  label,
  enabled,
  onChange,
  confirmTitle,
  confirmMessage,
}: {
  label: string;
  enabled: boolean;
  onChange: () => void;
  confirmTitle: string;
  confirmMessage: string;
}) {
  const action = enabled ? "Disable" : "Enable";
  return (
    <div className="toggle" style={{ justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #2a3765" }}>
      <span>{label}: {enabled ? "On" : "Off"}</span>
      <ConfirmDialog
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={`${action} now`}
        onConfirm={onChange}
      >
        <button
          aria-pressed={enabled}
          aria-label={`${action} ${label.toLowerCase()}`}
          style={{
            background: enabled ? "#c53030" : "#2f855a",
            color: "#fff",
            border: "none",
            padding: "0.3rem 0.8rem",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          {action}
        </button>
      </ConfirmDialog>
    </div>
  );
}

/** Small companion: shows the audit log is also fetched here for context.
The dedicated AuditLogSection renders the full filterable view. */
export { type AuditEntry };
