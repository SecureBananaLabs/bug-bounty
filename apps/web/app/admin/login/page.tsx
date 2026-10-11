"use client";

import { useState } from "react";
import { login, getAdminFromToken } from "../../../lib/api";

/**
 * Admin login page.
 *
 * In a full implementation this would integrate with the platform's auth
 * provider. Here it hits the existing /api/auth/login endpoint and stores the
 * returned JWT. The server-side adminAuth middleware enforces the admin role
 * on every subsequent API call — this page just obtains the token.
 */
export default function AdminLoginPage() {
  const [email, setEmail] = useState("dave@example.com");
  const [password, setPassword] = useState("password");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      // Redirect to the panel; the server-side adminAuth guard enforces the
      // admin role on every subsequent API call.
      window.location.assign("/admin");
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const existing = getAdminFromToken();

  return (
    <section className="card" aria-label="Admin login">
      <h2>Admin Login</h2>
      {existing && (
        <p>
          Logged in as <strong>{existing.sub}</strong> ({existing.role}).{" "}
          <a href="/admin" aria-label="Go to admin panel">
            Go to panel
          </a>
        </p>
      )}
      {error && (
        <div role="alert" aria-label="Login error" style={{ color: "#fc8181" }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem", maxWidth: "320px" }}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label="Admin email"
            disabled={submitting}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-label="Admin password"
            disabled={submitting}
          />
        </label>
        <button type="submit" disabled={submitting} aria-label="Log in">
          {submitting ? "Logging in…" : "Log in as admin"}
        </button>
      </form>
    </section>
  );
}
