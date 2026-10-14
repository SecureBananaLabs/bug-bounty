"use client";
import { useState } from "react";

export default function SettingsPage() {
  const [name, setName] = useState("Alex Johnson");
  const [email, setEmail] = useState("alex@example.com");
  const [visibility, setVisibility] = useState("public");
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section className="card">
      <h2>Settings</h2>
      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 400 }}>
        <label>
          Display name
          <input value={name} onChange={e => setName(e.target.value)} style={{ display: "block", width: "100%", marginTop: 4 }} />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ display: "block", width: "100%", marginTop: 4 }} />
        </label>
        <label>
          Profile visibility
          <select value={visibility} onChange={e => setVisibility(e.target.value)} style={{ display: "block", width: "100%", marginTop: 4 }}>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </label>
        <button type="submit">Save changes</button>
        {saved && <p style={{ color: "green" }}>Saved!</p>}
      </form>
    </section>
  );
}
