"use client";

import { useEffect, useState } from "react";

interface Settings {
  registrationsOpen: boolean;
  jobPostingsOpen: boolean;
  minTrustScoreToApply: number;
  autoFlagThreshold: number;
}

export default function SettingsPanel() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [draft, setDraft] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings", { credentials: "include" })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setSettings(res.data);
          setDraft(res.data);
        }
      });
  }, []);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(draft),
      });
      const json = await res.json();
      if (json.success) {
        setSettings(json.data);
        setDraft(json.data);
        setMessage("Saved.");
      } else {
        setMessage(`Error: ${json.message}`);
      }
    } catch {
      setMessage("Network error.");
    } finally {
      setSaving(false);
    }
  };

  if (!draft) return <p>Loading…</p>;

  return (
    <section>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Platform Settings</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 480 }}>
        <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem" }}>
          Registrations open
          <input type="checkbox" checked={draft.registrationsOpen}
            onChange={(e) => setDraft({ ...draft, registrationsOpen: e.target.checked })}
            style={{ width: 20, height: 20 }} />
        </label>

        <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem" }}>
          Job postings open
          <input type="checkbox" checked={draft.jobPostingsOpen}
            onChange={(e) => setDraft({ ...draft, jobPostingsOpen: e.target.checked })}
            style={{ width: 20, height: 20 }} />
        </label>

        <label style={{ fontSize: "0.9rem" }}>
          Minimum trust score to apply
          <input type="number" value={draft.minTrustScoreToApply}
            onChange={(e) => setDraft({ ...draft, minTrustScoreToApply: Number(e.target.value) })}
            min={0} max={100}
            style={{ display: "block", marginTop: 4, padding: "0.35rem", borderRadius: 4, border: "1px solid var(--border, #d1d5db)", width: "100%" }} />
        </label>

        <label style={{ fontSize: "0.9rem" }}>
          Auto-flag trust score threshold
          <input type="number" value={draft.autoFlagThreshold}
            onChange={(e) => setDraft({ ...draft, autoFlagThreshold: Number(e.target.value) })}
            min={0} max={100}
            style={{ display: "block", marginTop: 4, padding: "0.35rem", borderRadius: 4, border: "1px solid var(--border, #d1d5db)", width: "100%" }} />
        </label>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button onClick={save} disabled={saving}
            style={{ padding: "0.5rem 1.25rem", background: "var(--accent, #2563eb)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500 }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
          {message && <span style={{ fontSize: "0.85rem", color: message === "Saved." ? "#16a34a" : "#dc2626" }}>{message}</span>}
        </div>
      </div>
    </section>
  );
}
