"use client";

import { useState, useEffect, useCallback } from "react";

export default function PlatformControls() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ type: string; enabled: boolean } | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/metrics");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setConfig(data.platformConfig);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const toggle = async (type: string, enabled: boolean) => {
    const endpoint = type === "registrations" ? "registrations" : "postings";
    await fetch(`/api/admin/controls/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    setConfirmAction(null);
    fetch();
  };

  if (loading) return <div role="status">Loading controls...</div>;
  if (error) return <div role="alert" style={{ color: "red" }}>{error}</div>;
  if (!config) return null;

  return (
    <div>
      <ControlCard
        title="User Registrations"
        description="Allow new users to sign up on the platform."
        enabled={config.registrationsEnabled}
        onToggle={(enabled) => setConfirmAction({ type: "registrations", enabled })}
      />
      <ControlCard
        title="Job Postings"
        description="Allow users to post new jobs and listings."
        enabled={config.jobPostingsEnabled}
        onToggle={(enabled) => setConfirmAction({ type: "postings", enabled })}
      />

      {confirmAction && (
        <div className="card" style={{ padding: "1rem", marginTop: "1rem", background: "#1f2937", border: "2px solid #4f46e5" }}>
          <p style={{ marginBottom: "0.5rem" }}>
            Confirm: {confirmAction.enabled ? "Enable" : "Disable"} {confirmAction.type === "registrations" ? "user registrations" : "job postings"}?
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => toggle(confirmAction.type, confirmAction.enabled)} style={{ padding: "0.4rem 1rem", border: "none", borderRadius: 4, background: "#4f46e5", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
              Confirm
            </button>
            <button onClick={() => setConfirmAction(null)} style={{ padding: "0.4rem 1rem", border: "1px solid #4b5563", borderRadius: 4, background: "transparent", color: "#9ca3af", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ControlCard({ title, description, enabled, onToggle }: { title: string; description: string; enabled: boolean; onToggle: (v: boolean) => void }) {
  return (
    <div className="card" style={{ padding: "1rem", marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>{description}</div>
      </div>
      <button
        onClick={() => onToggle(!enabled)}
        style={{
          padding: "0.4rem 1rem",
          border: "none",
          borderRadius: 4,
          background: enabled ? "#22c55e" : "#6b7280",
          color: "#000",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "0.875rem",
        }}
        aria-label={`${enabled ? "Disable" : "Enable"} ${title}`}
        role="switch"
        aria-checked={enabled}
      >
        {enabled ? "Enabled" : "Disabled"}
      </button>
    </div>
  );
}
