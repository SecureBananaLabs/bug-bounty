"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: persist to API
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <section className="card">
      <h2>Settings</h2>
      <p>Account preferences, profile visibility, and security controls.</p>

      <form onSubmit={handleSave} style={{ marginTop: "1.5rem" }}>
        <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem", marginBottom: "1rem" }}>
          <legend style={{ fontWeight: 600 }}>Profile</legend>

          <label style={{ display: "block", marginBottom: "0.75rem" }}>
            Full Name
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem", borderRadius: 6, border: "1px solid #ccc" }}
            />
          </label>

          <label style={{ display: "block", marginBottom: "0.75rem" }}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem", borderRadius: 6, border: "1px solid #ccc" }}
            />
          </label>

          <label style={{ display: "block", marginBottom: "0.75rem" }}>
            Bio
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell clients about yourself..."
              rows={3}
              style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem", borderRadius: 6, border: "1px solid #ccc", resize: "vertical" }}
            />
          </label>
        </fieldset>

        <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem", marginBottom: "1rem" }}>
          <legend style={{ fontWeight: 600 }}>Preferences</legend>

          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
            />
            Enable email notifications
          </label>
        </fieldset>

        <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem", marginBottom: "1rem" }}>
          <legend style={{ fontWeight: 600 }}>Security</legend>

          <label style={{ display: "block", marginBottom: "0.75rem" }}>
            Current Password
            <input
              type="password"
              placeholder="••••••••"
              style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem", borderRadius: 6, border: "1px solid #ccc" }}
            />
          </label>

          <label style={{ display: "block", marginBottom: "0.75rem" }}>
            New Password
            <input
              type="password"
              placeholder="••••••••"
              style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem", borderRadius: 6, border: "1px solid #ccc" }}
            />
          </label>

          <label style={{ display: "block", marginBottom: "0.75rem" }}>
            Confirm New Password
            <input
              type="password"
              placeholder="••••••••"
              style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem", borderRadius: 6, border: "1px solid #ccc" }}
            />
          </label>
        </fieldset>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            type="submit"
            style={{
              background: "#5468ff",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "0.6rem 1.5rem",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            Save Changes
          </button>
          {saved && <span style={{ color: "#2e7d32" }}>✓ Settings saved</span>}
        </div>
      </form>
    </section>
  );
}
