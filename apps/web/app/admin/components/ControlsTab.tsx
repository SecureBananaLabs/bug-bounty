"use client";

import { useState } from "react";

export function ControlsTab() {
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [jobPostingEnabled, setJobPostingEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    // In production: POST /api/admin/config with { registrationEnabled, jobPostingEnabled }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <h3 style={{ marginBottom: 12 }}>Platform Controls</h3>
      <div className="card" style={{ padding: 16, maxWidth: 500 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={registrationEnabled}
              onChange={(e) => setRegistrationEnabled(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ fontWeight: 500 }}>Enable User Registration</span>
          </label>
          <p style={{ marginLeft: 26, fontSize: 13, color: "#666", marginTop: 4 }}>
            Allow new users to sign up for the platform.
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={jobPostingEnabled}
              onChange={(e) => setJobPostingEnabled(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ fontWeight: 500 }}>Enable Job Posting</span>
          </label>
          <p style={{ marginLeft: 26, fontSize: 13, color: "#666", marginTop: 4 }}>
            Allow clients to post new job listings.
          </p>
        </div>

        <button
          onClick={handleSave}
          style={{
            padding: "10px 20px",
            background: "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontWeight: 500
          }}
        >
          Save Changes
        </button>

        {saved && (
          <span style={{ marginLeft: 12, color: "#28a745", fontSize: 14 }}>
            ✓ Saved successfully
          </span>
        )}
      </div>
    </div>
  );
}
