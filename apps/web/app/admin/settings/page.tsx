"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "../../../lib/adminApi";
import { isAdmin } from "../../../lib/adminAuth";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    adminApi
      .getSettings()
      .then(setSettings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (isAdmin()) load(); }, []);

  const toggle = async (key: string) => {
    const currentValue = settings[key];
    setConfirming(key);
    setTimeout(() => {
      setConfirming(null);
      setSaving(key);
      adminApi
        .updateSetting(key, !currentValue)
        .then((updated) => setSettings((prev) => ({ ...prev, [key]: updated[key as keyof typeof updated] as boolean })))
        .catch((e) => alert((e as Error).message))
        .finally(() => setSaving(null));
    }, 200);
  };

  if (!isAdmin()) {
    return (
      <section className="card">
        <h2>Platform Controls</h2>
        <p style={{ color: "#f87171" }}>Access denied.</p>
        <Link href="/admin" className="card" style={{ display: "inline-block", marginTop: "0.5rem" }}>&larr; Back</Link>
      </section>
    );
  }

  const toggles = [
    {
      key: "allowRegistration",
      label: "Allow New User Registrations",
      description: "When disabled, new users will not be able to create accounts on the platform.",
    },
    {
      key: "allowJobPosting",
      label: "Allow New Job Postings",
      description: "When disabled, clients will not be able to post new jobs.",
    },
  ];

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2>Platform Controls</h2>
        <Link href="/admin" className="card" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>&larr; Back</Link>
      </div>

      {loading ? (
        <p style={{ color: "#94a3b8" }}>Loading…</p>
      ) : error ? (
        <p style={{ color: "#f87171" }}>{error}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {toggles.map((t) => (
            <div key={t.key} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 500, margin: 0 }}>{t.label}</p>
                <p style={{ color: "#94a3b8", margin: "0.25rem 0 0", fontSize: "0.85rem" }}>{t.description}</p>
                <p style={{ color: "#94a3b8", margin: "0.25rem 0 0", fontSize: "0.8rem" }}>
                  Current: <strong style={{ color: (settings[t.key] ?? true) ? "#34d399" : "#f87171" }}>
                    {(settings[t.key] ?? true) ? "Enabled" : "Disabled"}
                  </strong>
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {confirming === t.key && (
                  <p style={{ color: "#fbbf24", fontSize: "0.85rem" }}>Click again to confirm…</p>
                )}
                {saving === t.key ? (
                  <span style={{ color: "#94a3b8" }}>Saving…</span>
                ) : (
                  <button
                    onClick={() => toggle(t.key)}
                    className="card action-btn"
                    style={{
                      borderColor: (settings[t.key] ?? true) ? "#f87171" : "#34d399",
                      color: (settings[t.key] ?? true) ? "#f87171" : "#34d399",
                    }}
                  >
                    {(settings[t.key] ?? true) ? "Disable" : "Enable"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
