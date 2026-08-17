"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/admin$/, "") || "http://localhost:4000/api";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const payload = await response.json();
      const token = payload.data?.token;
      if (!response.ok || !token) throw new Error(payload.message || "Admin sign-in failed");
      window.localStorage.setItem("adminToken", token);
      document.cookie = `adminToken=${encodeURIComponent(token)}; Path=/; Max-Age=900; SameSite=Strict`;
      window.location.replace("/admin");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Admin sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card" style={{ maxWidth: 420, margin: "2rem auto" }}>
      <h2>Admin Sign-In</h2>
      <p style={{ color: "#a9b1d6" }}>Authenticate with the configured administrator account.</p>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
        <label>Email<input required type="email" aria-label="Admin email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>Password<input required minLength={8} type="password" aria-label="Admin password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {error && <p role="alert" style={{ color: "#ff8a8a" }}>{error}</p>}
        <button disabled={loading} type="submit">{loading ? "Signing in…" : "Access Panel"}</button>
      </form>
    </section>
  );
}
