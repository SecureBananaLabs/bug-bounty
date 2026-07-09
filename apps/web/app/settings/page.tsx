"use client";
import { useState } from "react";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section className="card">
      <h2>Settings</h2>
      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

        <fieldset>
          <legend><strong>Profile</strong></legend>
          <label>
            Display Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              style={{ display: "block", marginTop: "0.25rem", width: "100%" }}
            />
          </label>
          <label style={{ marginTop: "0.5rem", display: "block" }}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ display: "block", marginTop: "0.25rem", width: "100%" }}
            />
          </label>
        </fieldset>

        <fieldset>
          <legend><strong>Visibility</strong></legend>
          <label>
            <input
              type="checkbox"
              checked={profileVisible}
              onChange={(e) => setProfileVisible(e.target.checked)}
            />{" "}
            Make profile visible to clients
          </label>
        </fieldset>

        <fieldset>
          <legend><strong>Notifications</strong></legend>
          <label>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
            />{" "}
            Receive email notifications
          </label>
        </fieldset>

        <fieldset>
          <legend><strong>Security</strong></legend>
          <button type="button" style={{ cursor: "pointer" }}>
            Change Password
          </button>
        </fieldset>

        <button type="submit" style={{ cursor: "pointer" }}>
          {saved ? "Saved!" : "Save Changes"}
        </button>
      </form>
    </section>
  );
}
