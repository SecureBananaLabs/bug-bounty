"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "../../lib/api";

interface PlatformConfig {
  allowRegistration: boolean;
  allowJobPosting: boolean;
}

export function PlatformControls() {
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet<PlatformConfig>("/admin/config");
      setConfig(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleToggle = async (key: string, currentValue: boolean) => {
    const action = currentValue ? "disable" : "enable";
    if (!window.confirm(`Are you sure you want to ${action} ${key === "allowRegistration" ? "new user registrations" : "new job postings"}?`)) {
      return;
    }
    try {
      const data = await apiPatch<PlatformConfig>(`/admin/config`, { key, value: !currentValue });
      setConfig(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading && !config) {
    return <div style={{ padding: 16 }}>Loading platform configuration...</div>;
  }

  if (error) {
    return (
      <div>
        <h3>Platform Controls</h3>
        <p className="error">Failed to load: {error}</p>
        <button onClick={loadConfig} style={{ marginTop: 8 }}>Retry</button>
      </div>
    );
  }

  if (!config) return null;

  const controls = [
    {
      key: "allowRegistration",
      label: "Allow New User Registrations",
      description: "When disabled, new users cannot sign up for the platform.",
      value: config.allowRegistration,
    },
    {
      key: "allowJobPosting",
      label: "Allow New Job Postings",
      description: "When disabled, clients cannot post new job listings.",
      value: config.allowJobPosting,
    },
  ];

  return (
    <div>
      <h3>Platform Controls</h3>
      <p style={{ color: "#888", marginBottom: 16 }}>Manage global platform settings.</p>

      {controls.map((ctrl) => (
        <div
          key={ctrl.key}
          className="card"
          style={{ marginBottom: 12, padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <div>
            <div style={{ fontWeight: "bold" }}>{ctrl.label}</div>
            <div style={{ fontSize: "0.85rem", color: "#888", marginTop: 4 }}>{ctrl.description}</div>
          </div>
          <button
            onClick={() => handleToggle(ctrl.key, ctrl.value)}
            style={{
              padding: "0.5rem 1.5rem",
              borderRadius: 20,
              border: "none",
              cursor: "pointer",
              background: ctrl.value ? "#2a7a2a" : "#d94a4a",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "0.9rem",
            }}
          >
            {ctrl.value ? "ON" : "OFF"}
          </button>
        </div>
      ))}
    </div>
  );
}
