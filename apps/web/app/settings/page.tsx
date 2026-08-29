"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section className="card">
      <h2>Settings</h2>
      <p>Manage your account preferences, profile visibility, and security controls.</p>

      <form onSubmit={handleSave} style={{ marginTop: "1rem" }}>
        <label>
          Display Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            style={{ display: "block", width: "100%", marginBottom: "0.75rem", padding: "0.5rem" }}
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ display: "block", width: "100%", marginBottom: "0.75rem", padding: "0.5rem" }}
          />
        </label>

        <button type="submit" style={{ padding: "0.5rem 1.5rem", cursor: "pointer" }}>
          Save Changes
        </button>
        {saved && <span style={{ marginLeft: "1rem", color: "green" }}>✓ Saved</span>}
      </form>
    </section>
  );
}
