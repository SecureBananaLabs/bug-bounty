"use client";

import { useEffect, useState } from "react";
import { AdminGuard } from "../../components/AdminGuard";
import { fetchApi, logout } from "../../lib/api";

function MetricsSection() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetchApi("/admin/metrics").then(setMetrics).catch(console.error);
  }, []);

  if (!metrics) return <div>Loading metrics...</div>;

  return (
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
      <div className="card" style={{ flex: 1, minWidth: 150 }}>
        <h4>Open Jobs</h4>
        <p style={{ fontSize: "2rem", margin: 0 }}>{metrics.openJobs}</p>
      </div>
      <div className="card" style={{ flex: 1, minWidth: 150 }}>
        <h4>Active Freelancers</h4>
        <p style={{ fontSize: "2rem", margin: 0 }}>{metrics.activeFreelancers}</p>
      </div>
      <div className="card" style={{ flex: 1, minWidth: 150 }}>
        <h4>Flagged Listings</h4>
        <p style={{ fontSize: "2rem", margin: 0 }}>{metrics.flaggedListings}</p>
      </div>
      <div className="card" style={{ flex: 1, minWidth: 150 }}>
        <h4>Open Disputes</h4>
        <p style={{ fontSize: "2rem", margin: 0 }}>{metrics.openDisputes}</p>
      </div>
    </div>
  );
}

function FlaggedJobsSection() {
  const [jobs, setJobs] = useState<any[]>([]);

  const loadJobs = () => {
    fetchApi("/admin/jobs/flagged").then(setJobs).catch(console.error);
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const moderate = async (id: string, action: string) => {
    await fetchApi(`/admin/jobs/${id}/moderate`, {
      method: "POST",
      body: JSON.stringify({ action, reason: "Admin reviewed" })
    });
    loadJobs();
  };

  return (
    <div className="card" style={{ marginBottom: "2rem" }}>
      <h3>Flagged Jobs</h3>
      {jobs.filter(j => j.status === 'pending').length === 0 ? (
        <p>No pending flagged jobs.</p>
      ) : (
        <table style={{ width: "100%", textAlign: "left" }}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Reason</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {jobs.filter(j => j.status === 'pending').map(job => (
              <tr key={job.id}>
                <td>{job.title}</td>
                <td style={{ color: "#e74c3c" }}>{job.reason}</td>
                <td>
                  <button onClick={() => moderate(job.id, 'approved')} style={{ marginRight: 8 }}>Approve</button>
                  <button onClick={() => moderate(job.id, 'rejected')}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function DisputesSection() {
  const [disputes, setDisputes] = useState<any[]>([]);

  const loadDisputes = () => {
    fetchApi("/admin/disputes").then(setDisputes).catch(console.error);
  };

  useEffect(() => {
    loadDisputes();
  }, []);

  const rule = async (id: string, ruling: string) => {
    await fetchApi(`/admin/disputes/${id}/rule`, {
      method: "POST",
      body: JSON.stringify({ ruling, notes: "Admin ruled" })
    });
    loadDisputes();
  };

  return (
    <div className="card" style={{ marginBottom: "2rem" }}>
      <h3>Active Disputes</h3>
      {disputes.filter(d => d.status !== 'resolved').length === 0 ? (
        <p>No active disputes.</p>
      ) : (
        <table style={{ width: "100%", textAlign: "left" }}>
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {disputes.filter(d => d.status !== 'resolved').map(d => (
              <tr key={d.id}>
                <td>{d.jobId}</td>
                <td>${d.amount}</td>
                <td>
                  <button onClick={() => rule(d.id, 'client_favored')} style={{ marginRight: 8 }}>Favor Client</button>
                  <button onClick={() => rule(d.id, 'freelancer_favored')}>Favor Freelancer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AuditLogsSection() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchApi("/admin/audit-logs").then(setLogs).catch(console.error);
  }, []);

  return (
    <div className="card">
      <h3>Recent Audit Logs</h3>
      {logs.length === 0 ? <p>No logs yet.</p> : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {logs.map(log => (
            <li key={log.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid #ddd" }}>
              <strong>{log.action}</strong> by {log.adminId} at {new Date(log.timestamp).toLocaleString()}
              <br />
              <small style={{ color: "#666" }}>{JSON.stringify(log.details)}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminPanelPage() {
  return (
    <AdminGuard>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2>Admin Dashboard</h2>
        <button onClick={() => { logout(); window.location.reload(); }} style={{ padding: "8px 16px" }}>Logout</button>
      </div>
      <MetricsSection />
      <FlaggedJobsSection />
      <DisputesSection />
      <AuditLogsSection />
    </AdminGuard>
  );
}
