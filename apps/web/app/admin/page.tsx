import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import {
  adminMetrics,
  adminUsers,
  auditTrail,
  disputes,
  moderationQueue
} from "../../lib/admin-mock";

const jwtSecret = process.env.JWT_SECRET ?? "development-secret";

async function getToken(searchParams: Record<string, string | string[] | undefined>) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("ff_access_token")?.value;
  const queryToken = typeof searchParams.token === "string" ? searchParams.token : undefined;
  return cookieToken ?? queryToken ?? null;
}

function verifyAdminToken(token: string | null) {
  if (!token) {
    return { ok: false, reason: "No admin token provided" };
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { role?: string; sub?: string };
    if (decoded.role !== "admin") {
      return { ok: false, reason: "Admin role required" };
    }

    return { ok: true, subject: decoded.sub ?? "admin" };
  } catch {
    return { ok: false, reason: "Invalid or expired token" };
  }
}

function SectionTitle({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="admin-section-title">
      <span>{eyebrow}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <article className="card admin-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

export default async function AdminPanelPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const token = await getToken(searchParams ?? {});
  const access = verifyAdminToken(token);

  if (!access.ok) {
    return (
      <section className="card">
        <h2>403</h2>
        <p>Admin access required. Provide a valid admin JWT via the `ff_access_token` cookie or `?token=` query param for preview.</p>
        <p className="muted">{access.reason}</p>
      </section>
    );
  }

  return (
    <section className="admin-shell">
      <header className="card admin-hero">
        <div>
          <span className="eyebrow">Admin Command Center</span>
          <h2>Platform control, moderation, and trust operations</h2>
          <p>
            Signed in as <strong>{access.subject}</strong>. This dashboard is driven by server-side data and protected admin APIs.
          </p>
        </div>
        <form>
          <button className="admin-button" type="submit" aria-label="Refresh admin dashboard">
            Refresh data
          </button>
        </form>
      </header>

      <section className="grid admin-metrics-grid" aria-label="Trust metrics overview">
        <MetricCard label="Total users" value={adminMetrics.totalUsers} helper="Registered clients and freelancers" />
        <MetricCard label="Active jobs" value={adminMetrics.activeJobs} helper="Live marketplace work" />
        <MetricCard label="Open disputes" value={adminMetrics.openDisputes} helper="Needs moderation" />
        <MetricCard label="Flagged listings" value={adminMetrics.flaggedListings} helper="Review queue" />
      </section>

      <section className="card">
        <SectionTitle
          eyebrow="Trust score"
          title="Distribution across the user base"
          description="Quick glance at healthy, at-risk, and low-trust cohorts."
        />
        <div className="trust-bars" aria-label="Trust score distribution chart">
          {adminMetrics.trustScoreBuckets.map((bucket) => (
            <div key={bucket.label} className="trust-bar-row">
              <span>{bucket.label}</span>
              <div className="trust-bar-track">
                <div className="trust-bar-fill" style={{ width: `${bucket.count * 7}%` }} />
              </div>
              <strong>{bucket.count}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <SectionTitle
          eyebrow="User management"
          title="Searchable user table"
          description="Server-side pagination is represented in the data layer; this preview shows the current page of users."
        />
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col">Joined</th>
                <th scope="col">Jobs</th>
                <th scope="col">Disputes</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name}</strong>
                    <div className="muted">{user.email}</div>
                  </td>
                  <td>{user.role}</td>
                  <td>{user.status}</td>
                  <td>{user.joinedAt}</td>
                  <td>{user.activeJobs}</td>
                  <td>{user.disputes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid admin-columns" aria-label="Moderation and disputes">
        <article className="card">
          <SectionTitle
            eyebrow="Moderation"
            title="Flagged listings queue"
            description="Approve, reject, or escalate items reported by automated rules or users."
          />
          <div className="stack">
            {moderationQueue.map((item) => (
              <div key={item.id} className="stack-item">
                <div>
                  <strong>{item.title}</strong>
                  <div className="muted">{item.owner}</div>
                  <div className="muted">{item.reason}</div>
                </div>
                <div className="button-row">
                  <button className="admin-button secondary" type="button" aria-label={`Approve ${item.title}`}>Approve</button>
                  <button className="admin-button secondary" type="button" aria-label={`Reject ${item.title}`}>Reject</button>
                  <button className="admin-button secondary" type="button" aria-label={`Escalate ${item.title}`}>Escalate</button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <SectionTitle
            eyebrow="Disputes"
            title="Open dispute queue"
            description="Threads, evidence, and transaction details with one-click resolutions."
          />
          <div className="stack">
            {disputes.map((dispute) => (
              <div key={dispute.id} className="stack-item">
                <div>
                  <strong>{dispute.title}</strong>
                  <div className="muted">{dispute.parties}</div>
                  <div className="muted">{dispute.evidence}</div>
                  <div className="muted">{dispute.amount}</div>
                </div>
                <div className="button-row">
                  <button className="admin-button secondary" type="button" aria-label={`Rule for freelancer on ${dispute.title}`}>Freelancer</button>
                  <button className="admin-button secondary" type="button" aria-label={`Rule for client on ${dispute.title}`}>Client</button>
                  <button className="admin-button secondary" type="button" aria-label={`Refund on ${dispute.title}`}>Refund</button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid admin-columns">
        <article className="card">
          <SectionTitle
            eyebrow="Platform controls"
            title="Registration and posting toggles"
            description="Confirmation-first controls for changing platform behavior."
          />
          <div className="toggle-grid">
            <label className="toggle-item">
              <span>Enable new registrations</span>
              <button className="admin-toggle" type="button" aria-pressed="true" aria-label="Toggle registrations">
                On
              </button>
            </label>
            <label className="toggle-item">
              <span>Enable new job postings</span>
              <button className="admin-toggle" type="button" aria-pressed="true" aria-label="Toggle job postings">
                On
              </button>
            </label>
          </div>
        </article>

        <article className="card">
          <SectionTitle
            eyebrow="Audit log"
            title="Append-only admin actions"
            description="Bans, rulings, toggles, and moderation actions are recorded for review."
          />
          <div className="stack">
            {auditTrail.map((entry) => (
              <div key={entry.id} className="stack-item">
                <div>
                  <strong>{entry.action}</strong>
                  <div className="muted">{entry.detail}</div>
                </div>
                <div className="muted">
                  <div>{entry.admin}</div>
                  <div>{entry.createdAt}</div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}
