"use client";

import { useEffect, useState } from "react";

interface FlaggedUser { id: string; email: string; role: string; trustScore: number; }
interface FlaggedJob  { id: string; title: string; clientId: string; }

export default function FlagManagement() {
  const [flaggedUsers, setFlaggedUsers] = useState<FlaggedUser[]>([]);
  const [flaggedJobs, setFlaggedJobs] = useState<FlaggedJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlags = () => {
    setLoading(true);
    fetch("/api/admin/flags", { credentials: "include" })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setFlaggedUsers(res.data.users ?? []);
          setFlaggedJobs(res.data.jobs ?? []);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFlags(); }, []);

  const clearFlag = (type: string, id: string) => {
    fetch(`/api/admin/flags/${type}/${id}`, { method: "DELETE", credentials: "include" })
      .then(() => fetchFlags());
  };

  if (loading) return <p>Loading…</p>;

  const total = flaggedUsers.length + flaggedJobs.length;

  if (total === 0) {
    return (
      <section>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Flags</h2>
        <p style={{ color: "var(--muted, #6b7280)" }}>No flagged items — everything looks clean.</p>
      </section>
    );
  }

  return (
    <section>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>
        Flags
        <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "var(--muted, #6b7280)", marginLeft: "0.5rem" }}>
          ({total} item{total !== 1 ? "s" : ""})
        </span>
      </h2>

      {flaggedUsers.length > 0 && (
        <>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Flagged Users</h3>
          <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid var(--border, #e5e7eb)" }}>
                  <th style={{ padding: "0.5rem" }}>ID</th>
                  <th style={{ padding: "0.5rem" }}>Email</th>
                  <th style={{ padding: "0.5rem" }}>Role</th>
                  <th style={{ padding: "0.5rem" }}>Trust</th>
                  <th style={{ padding: "0.5rem" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {flaggedUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--border, #e5e7eb)", background: "#fef3c720" }}>
                    <td style={{ padding: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem" }}>{u.id}</td>
                    <td style={{ padding: "0.5rem" }}>{u.email}</td>
                    <td style={{ padding: "0.5rem" }}>{u.role}</td>
                    <td style={{ padding: "0.5rem", color: "#dc2626", fontWeight: 600 }}>{u.trustScore}</td>
                    <td style={{ padding: "0.5rem" }}>
                      <button onClick={() => clearFlag("user", u.id)}
                        style={{ padding: "0.25rem 0.75rem", background: "#16a34a", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.75rem" }}>
                        Clear Flag
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {flaggedJobs.length > 0 && (
        <>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Flagged Jobs</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid var(--border, #e5e7eb)" }}>
                  <th style={{ padding: "0.5rem" }}>ID</th>
                  <th style={{ padding: "0.5rem" }}>Title</th>
                  <th style={{ padding: "0.5rem" }}>Client</th>
                  <th style={{ padding: "0.5rem" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {flaggedJobs.map((j) => (
                  <tr key={j.id} style={{ borderBottom: "1px solid var(--border, #e5e7eb)", background: "#fef3c720" }}>
                    <td style={{ padding: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem" }}>{j.id}</td>
                    <td style={{ padding: "0.5rem" }}>{j.title}</td>
                    <td style={{ padding: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem" }}>{j.clientId}</td>
                    <td style={{ padding: "0.5rem" }}>
                      <button onClick={() => clearFlag("job", j.id)}
                        style={{ padding: "0.25rem 0.75rem", background: "#16a34a", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.75rem" }}>
                        Clear Flag
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
