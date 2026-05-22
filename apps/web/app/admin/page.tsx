"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPanelPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState(null);
  const [disputes, setDisputes] = useState(null);
  const [moderation, setModeration] = useState(null);
  const [audit, setAudit] = useState(null);

  const [activeTab, setActiveTab] = useState("metrics");

  useEffect(() => {
    // Check if the user is admin
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Attempt to fetch metrics to verify admin status
    fetch("http://localhost:3000/api/admin/metrics", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(res => {
      if (res.ok) {
        setIsAdmin(true);
        return res.json();
      } else {
        router.push("/");
        throw new Error("Not authorized");
      }
    })
    .then(data => {
      setMetrics(data.data);
      setLoading(false);
    })
    .catch(() => {
      setLoading(false);
    });
  }, [router]);

  const loadData = async (endpoint, setter) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:3000/api/admin/${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setter(data.data);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === "users" && !users) loadData("users", setUsers);
      if (activeTab === "moderation" && !moderation) loadData("moderation", setModeration);
      if (activeTab === "disputes" && !disputes) loadData("disputes", setDisputes);
      if (activeTab === "audit" && !audit) loadData("audit", setAudit);
    }
  }, [activeTab, isAdmin]);

  if (loading) return <p aria-live="polite">Loading admin panel...</p>;
  if (!isAdmin) return <p>Access denied.</p>;

  return (
    <section className="admin-panel" style={{ padding: "20px" }}>
      <h2>Admin Dashboard</h2>
      <div className="tabs" style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button onClick={() => setActiveTab("metrics")} aria-selected={activeTab === "metrics"}>Metrics & Controls</button>
        <button onClick={() => setActiveTab("users")} aria-selected={activeTab === "users"}>Users</button>
        <button onClick={() => setActiveTab("moderation")} aria-selected={activeTab === "moderation"}>Moderation</button>
        <button onClick={() => setActiveTab("disputes")} aria-selected={activeTab === "disputes"}>Disputes</button>
        <button onClick={() => setActiveTab("audit")} aria-selected={activeTab === "audit"}>Audit Log</button>
      </div>

      <div className="tab-content" role="tabpanel">
        {activeTab === "metrics" && (
          <div>
            <h3>Platform Health</h3>
            {metrics ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                <div className="card"><h4>Open Jobs</h4><p>{metrics.openJobs}</p></div>
                <div className="card"><h4>Active Freelancers</h4><p>{metrics.activeFreelancers}</p></div>
                <div className="card"><h4>Flagged Accounts</h4><p>{metrics.flaggedAccounts}</p></div>
                <div className="card"><h4>Monthly Volume</h4><p>${metrics.monthlyVolume}</p></div>
              </div>
            ) : <p>Loading metrics...</p>}
            
            <h3 style={{ marginTop: "20px" }}>Platform Controls</h3>
            <div>
              <label>
                <input type="checkbox" onChange={(e) => {
                  if(window.confirm("Are you sure you want to toggle user registration?")) {
                    const token = localStorage.getItem("token");
                    fetch(`http://localhost:3000/api/admin/controls`, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                      body: JSON.stringify({ setting: "registration", enabled: e.target.checked })
                    });
                  } else {
                    e.target.checked = !e.target.checked;
                  }
                }} /> Enable New User Registrations
              </label>
              <br/>
              <label>
                <input type="checkbox" onChange={(e) => {
                  if(window.confirm("Are you sure you want to toggle job postings?")) {
                    const token = localStorage.getItem("token");
                    fetch(`http://localhost:3000/api/admin/controls`, {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                      body: JSON.stringify({ setting: "job_posting", enabled: e.target.checked })
                    });
                  } else {
                    e.target.checked = !e.target.checked;
                  }
                }} /> Enable New Job Postings
              </label>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <h3>User Management</h3>
            {users ? (
              <table style={{ width: "100%", textAlign: "left" }} aria-label="Users Table">
                <thead><tr><th>ID</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.items?.length > 0 ? users.items.map(u => (
                    <tr key={u.id}>
                      <td>{u.id}</td><td>{u.role}</td><td>{u.status}</td>
                      <td>
                        <button onClick={() => {
                          const token = localStorage.getItem("token");
                          fetch(`http://localhost:3000/api/admin/users/${u.id}/status`, {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "suspended" })
                          }).then(() => loadData("users", setUsers));
                        }}>Suspend</button>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="4">No users found.</td></tr>}
                </tbody>
              </table>
            ) : <p>Loading users...</p>}
            <div style={{ marginTop: "10px" }}>
              <button>Prev Page</button> <button>Next Page</button>
            </div>
          </div>
        )}

        {activeTab === "moderation" && (
          <div>
            <h3>Job Moderation Queue</h3>
            {moderation ? (
              <table style={{ width: "100%", textAlign: "left" }}>
                <thead><tr><th>Job ID</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {moderation.items?.length > 0 ? moderation.items.map(m => (
                    <tr key={m.id}>
                      <td>{m.id}</td><td>{m.status}</td>
                      <td>
                        <button onClick={() => {
                          const token = localStorage.getItem("token");
                          fetch(`http://localhost:3000/api/admin/moderation/${m.id}/status`, {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "approved" })
                          }).then(() => loadData("moderation", setModeration));
                        }}>Approve</button>
                        <button onClick={() => {
                          const token = localStorage.getItem("token");
                          fetch(`http://localhost:3000/api/admin/moderation/${m.id}/status`, {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "rejected", reason: "Policy violation" })
                          }).then(() => loadData("moderation", setModeration));
                        }}>Reject</button>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="3">No items in moderation queue.</td></tr>}
                </tbody>
              </table>
            ) : <p>Loading moderation queue...</p>}
            <div style={{ marginTop: "10px" }}>
              <button>Prev Page</button> <button>Next Page</button>
            </div>
          </div>
        )}

        {activeTab === "disputes" && (
          <div>
            <h3>Dispute Resolution</h3>
            {disputes ? (
              <table style={{ width: "100%", textAlign: "left" }}>
                <thead><tr><th>Dispute ID</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {disputes.items?.length > 0 ? disputes.items.map(d => (
                    <tr key={d.id}>
                      <td>{d.id}</td><td>{d.status}</td>
                      <td>
                        <button onClick={() => {
                          const token = localStorage.getItem("token");
                          fetch(`http://localhost:3000/api/admin/disputes/${d.id}/ruling`, {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                            body: JSON.stringify({ ruling: "freelancer", refund: false })
                          }).then(() => loadData("disputes", setDisputes));
                        }}>Rule for Freelancer</button>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="3">No active disputes.</td></tr>}
                </tbody>
              </table>
            ) : <p>Loading disputes...</p>}
            <div style={{ marginTop: "10px" }}>
              <button>Prev Page</button> <button>Next Page</button>
            </div>
          </div>
        )}

        {activeTab === "audit" && (
          <div>
            <h3>Audit Log</h3>
            {audit ? (
              <table style={{ width: "100%", textAlign: "left" }}>
                <thead><tr><th>Timestamp</th><th>Admin ID</th><th>Action</th><th>Details</th></tr></thead>
                <tbody>
                  {audit.items?.length > 0 ? audit.items.map(a => (
                    <tr key={a.id}>
                      <td>{new Date(a.timestamp).toLocaleString()}</td>
                      <td>{a.adminId}</td>
                      <td>{a.actionType}</td>
                      <td>{JSON.stringify(a.details)}</td>
                    </tr>
                  )) : <tr><td colSpan="4">No audit logs found.</td></tr>}
                </tbody>
              </table>
            ) : <p>Loading audit log...</p>}
            <div style={{ marginTop: "10px" }}>
              <button>Prev Page</button> <button>Next Page</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
