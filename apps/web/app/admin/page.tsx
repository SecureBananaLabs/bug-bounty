import { Button, Card } from "@freelanceflow/ui";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface Job {
  id: string;
  title: string;
  budget: string;
  status: string;
  flagged: boolean;
}

interface Dispute {
  id: string;
  jobId: string;
  reason: string;
  status: string;
}

const users: User[] = [
  { id: "u1", name: "Alice Chen", email: "alice@example.com", role: "freelancer", status: "active" },
  { id: "u2", name: "Bob Smith", email: "bob@example.com", role: "client", status: "active" },
  { id: "u3", name: "Charlie Davis", email: "charlie@example.com", role: "freelancer", status: "flagged" },
  { id: "u4", name: "Diana Park", email: "diana@example.com", role: "admin", status: "active" },
];

const jobs: Job[] = [
  { id: "j1", title: "Build an AI customer support widget", budget: "$1,500", status: "open", flagged: false },
  { id: "j2", title: "Migrate legacy API to Node.js", budget: "$2,800", status: "in-progress", flagged: false },
  { id: "j3", title: "Design SaaS onboarding flows", budget: "$900", status: "open", flagged: true },
];

const disputes: Dispute[] = [
  { id: "d1", jobId: "j2", reason: "Payment withheld", status: "open" },
  { id: "d2", jobId: "j1", reason: "Scope creep dispute", status: "escalated" },
];

export default function AdminPanelPage() {
  return (
    <section>
      <h2>Admin Panel</h2>
      <p>Moderation queues, trust metrics, and platform controls.</p>

      <Card title="Platform Health">
        <div className="grid">
          <div className="card">
            <h4>Open Jobs</h4>
            <p style={{ fontSize: "1.8rem", fontWeight: 700 }}>42</p>
          </div>
          <div className="card">
            <h4>Active Freelancers</h4>
            <p style={{ fontSize: "1.8rem", fontWeight: 700 }}>185</p>
          </div>
          <div className="card">
            <h4>Flagged Accounts</h4>
            <p style={{ fontSize: "1.8rem", fontWeight: 700, color: "#ff6b6b" }}>3</p>
          </div>
          <div className="card">
            <h4>Monthly Volume</h4>
            <p style={{ fontSize: "1.8rem", fontWeight: 700 }}>$128,900</p>
          </div>
        </div>
      </Card>

      <Card title="User Management">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #2a3765" }}>
              <th style={{ padding: "0.5rem" }}>Name</th>
              <th style={{ padding: "0.5rem" }}>Email</th>
              <th style={{ padding: "0.5rem" }}>Role</th>
              <th style={{ padding: "0.5rem" }}>Status</th>
              <th style={{ padding: "0.5rem" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #1e2747" }}>
                <td style={{ padding: "0.5rem" }}>{u.name}</td>
                <td style={{ padding: "0.5rem" }}>{u.email}</td>
                <td style={{ padding: "0.5rem" }}>{u.role}</td>
                <td style={{ padding: "0.5rem", color: u.status === "flagged" ? "#ff6b6b" : "inherit" }}>
                  {u.status}
                </td>
                <td style={{ padding: "0.5rem" }}>
                  <Button>{u.status === "flagged" ? "Unflag" : "Suspend"}</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Job Management">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #2a3765" }}>
              <th style={{ padding: "0.5rem" }}>Title</th>
              <th style={{ padding: "0.5rem" }}>Budget</th>
              <th style={{ padding: "0.5rem" }}>Status</th>
              <th style={{ padding: "0.5rem" }}>Flags</th>
              <th style={{ padding: "0.5rem" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} style={{ borderBottom: "1px solid #1e2747" }}>
                <td style={{ padding: "0.5rem" }}>{j.title}</td>
                <td style={{ padding: "0.5rem" }}>{j.budget}</td>
                <td style={{ padding: "0.5rem" }}>{j.status}</td>
                <td style={{ padding: "0.5rem", color: j.flagged ? "#ff6b6b" : "inherit" }}>
                  {j.flagged ? "Flagged" : "—"}
                </td>
                <td style={{ padding: "0.5rem" }}>
                  <Button>{j.flagged ? "Unflag" : "Hide"}</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Disputes">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #2a3765" }}>
              <th style={{ padding: "0.5rem" }}>Dispute ID</th>
              <th style={{ padding: "0.5rem" }}>Job</th>
              <th style={{ padding: "0.5rem" }}>Reason</th>
              <th style={{ padding: "0.5rem" }}>Status</th>
              <th style={{ padding: "0.5rem" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {disputes.map((d) => (
              <tr key={d.id} style={{ borderBottom: "1px solid #1e2747" }}>
                <td style={{ padding: "0.5rem" }}>{d.id}</td>
                <td style={{ padding: "0.5rem" }}>{d.jobId}</td>
                <td style={{ padding: "0.5rem" }}>{d.reason}</td>
                <td style={{ padding: "0.5rem", color: d.status === "escalated" ? "#ffa500" : "inherit" }}>
                  {d.status}
                </td>
                <td style={{ padding: "0.5rem" }}>
                  <Button>Review</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
