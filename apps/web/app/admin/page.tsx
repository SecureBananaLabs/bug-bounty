import { cookies, headers } from "next/headers";
import { AdminActionButton } from "../../components/AdminActionButton";
import { AdminRefreshButton } from "../../components/AdminRefreshButton";
import { getAdminApiBaseUrl, loadAdminDashboard } from "../../lib/admin";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function readAdminToken() {
  const headerToken = headers().get("authorization")?.replace(/^Bearer\s+/i, "");
  const cookieToken = cookies().get("ff_admin_token")?.value;
  const fallbackToken = cookies().get("ff_admin_demo_token")?.value;

  return headerToken ?? cookieToken ?? fallbackToken ?? "";
}

function statusClass(status: string) {
  if (status === "active" || status === "approved" || status === "resolved") {
    return "success";
  }

  if (status === "suspended" || status === "under_review" || status === "open") {
    return "warning";
  }

  return "danger";
}

export default async function AdminPanelPage({ searchParams }: { searchParams: SearchParams }) {
  const token = readAdminToken();

  if (!token) {
    return (
      <section className="panel">
        <p className="eyebrow">Admin</p>
        <h2>403 Admin access required</h2>
        <p className="muted">An admin token is required to view this panel.</p>
      </section>
    );
  }

  const filters = {
    q: firstValue(searchParams.q),
    role: firstValue(searchParams.role),
    status: firstValue(searchParams.status),
    joinedAfter: firstValue(searchParams.joinedAfter),
    page: firstValue(searchParams.page),
    pageSize: firstValue(searchParams.pageSize)
  };

  try {
    const data = await loadAdminDashboard(token, filters);
    const overview = data.overview as {
      summary: Record<string, string | number>;
      trustScoreDistribution: Array<{ label: string; count: number }>;
      recentAudit: Array<{ id: string; timestamp: string; action: string; target: string; details: string }>;
      controls: Record<string, boolean>;
    };
    const users = data.users as {
      items: Array<{
        id: string;
        name: string;
        email: string;
        role: string;
        status: string;
        joinedAt: string;
        trustScore: number;
        activeJobs: number;
        disputes: number;
        location: string;
      }>;
      page: number;
      totalPages: number;
      total: number;
    };
    const jobs = data.jobs as {
      items: Array<{
        id: string;
        title: string;
        client: string;
        status: string;
        budget: string;
        reason: string;
        reviewerNotes: string;
      }>;
    };
    const disputes = data.disputes as {
      items: Array<{
        id: string;
        client: string;
        freelancer: string;
        status: string;
        amount: string;
        updatedAt: string;
        thread: string;
        evidence: string;
      }>;
    };
    const controls = data.controls as { registrationsEnabled: boolean; jobPostingsEnabled: boolean };
    const auditLog = data.auditLog as { items: Array<{ timestamp: string; adminId: string; action: string; target: string; details: string }> };
    const baseUrl = getAdminApiBaseUrl();

    return (
      <section className="admin-shell">
        <header className="panel admin-hero">
          <div>
            <p className="eyebrow">Admin Control Center</p>
            <h2>Moderation, trust, and platform controls</h2>
            <p className="muted">Server-side guarded, API-backed, and wired for real action buttons.</p>
          </div>
          <AdminRefreshButton />
        </header>

        <section className="admin-stats">
          <article className="stat">
            <span>Total users</span>
            <strong>{String(overview.summary.totalUsers ?? "0")}</strong>
          </article>
          <article className="stat">
            <span>Active jobs</span>
            <strong>{String(overview.summary.activeJobs ?? "0")}</strong>
          </article>
          <article className="stat">
            <span>Open disputes</span>
            <strong>{String(overview.summary.openDisputes ?? "0")}</strong>
          </article>
          <article className="stat">
            <span>Flagged listings</span>
            <strong>{String(overview.summary.flaggedListings ?? "0")}</strong>
          </article>
          <article className="stat">
            <span>Revenue</span>
            <strong>{String(overview.summary.revenue ?? "$0")}</strong>
          </article>
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Trust score</p>
              <h3>Distribution</h3>
            </div>
            <span className="muted">Snapshot from the live admin API</span>
          </div>
          <div className="trust-bars">
            {overview.trustScoreDistribution.map((bucket) => (
              <div key={bucket.label} className="trust-row">
                <div className="trust-labels">
                  <span>{bucket.label}</span>
                  <strong>{bucket.count}</strong>
                </div>
                <div className="progress" aria-hidden="true">
                  <span style={{ width: `${Math.min(100, bucket.count * 25)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Filters</p>
              <h3>User directory</h3>
            </div>
            <span className="muted">
              Page {users.page} of {users.totalPages} across {users.total} users
            </span>
          </div>
          <form className="filter-bar" method="get">
            <label>
              Search
              <input name="q" defaultValue={filters.q} placeholder="name, email, or location" />
            </label>
            <label>
              Role
              <select name="role" defaultValue={filters.role ?? ""}>
                <option value="">All</option>
                <option value="client">Client</option>
                <option value="freelancer">Freelancer</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label>
              Status
              <select name="status" defaultValue={filters.status ?? ""}>
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
            </label>
            <label>
              Joined after
              <input name="joinedAfter" defaultValue={filters.joinedAfter} type="date" />
            </label>
            <label>
              Page size
              <select name="pageSize" defaultValue={filters.pageSize ?? "5"}>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
              </select>
            </label>
            <div className="filter-actions">
              <button type="submit">Apply</button>
              <a className="button secondary" href="/admin">
                Clear
              </a>
            </div>
          </form>

          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Trust</th>
                <th>Activity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.items.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name}</strong>
                    <div className="muted">{user.email}</div>
                    <div className="muted">{user.location}</div>
                  </td>
                  <td>
                    <span className="badge">{user.role}</span>
                  </td>
                  <td>
                    <span className={`badge badge--${statusClass(user.status)}`}>{user.status}</span>
                  </td>
                  <td>{new Date(user.joinedAt).toLocaleDateString()}</td>
                  <td>{user.trustScore}</td>
                  <td>
                    {user.activeJobs} active jobs
                    <br />
                    {user.disputes} disputes
                  </td>
                  <td>
                    <div className="action-row">
                      <AdminActionButton
                        apiBaseUrl={baseUrl}
                        token={token}
                        endpoint={`/api/admin/users/${user.id}/status`}
                        body={{ action: "suspend", reason: "Manual review from admin panel" }}
                        label="Suspend"
                        tone="warning"
                      />
                      <AdminActionButton
                        apiBaseUrl={baseUrl}
                        token={token}
                        endpoint={`/api/admin/users/${user.id}/status`}
                        body={{ action: "reinstate", reason: "Cleared by admin panel review" }}
                        label="Reinstate"
                      />
                      <AdminActionButton
                        apiBaseUrl={baseUrl}
                        token={token}
                        endpoint={`/api/admin/users/${user.id}/status`}
                        body={{ action: "ban", reason: "Severe policy violation" }}
                        label="Ban"
                        tone="danger"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Moderation</p>
              <h3>Flagged jobs</h3>
            </div>
            <span className="muted">Listings flagged by rules or reports</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Listing</th>
                <th>Status</th>
                <th>Budget</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.items.map((job) => (
                <tr key={job.id}>
                  <td>
                    <strong>{job.title}</strong>
                    <div className="muted">{job.client}</div>
                  </td>
                  <td>
                    <span className={`badge badge--${statusClass(job.status)}`}>{job.status}</span>
                  </td>
                  <td>{job.budget}</td>
                  <td>
                    <div>{job.reason || job.reviewerNotes}</div>
                  </td>
                  <td>
                    <div className="action-row">
                      <AdminActionButton
                        apiBaseUrl={baseUrl}
                        token={token}
                        endpoint={`/api/admin/jobs/${job.id}/review`}
                        body={{ decision: "approve", reason: "Listing cleared by moderator" }}
                        label="Approve"
                      />
                      <AdminActionButton
                        apiBaseUrl={baseUrl}
                        token={token}
                        endpoint={`/api/admin/jobs/${job.id}/review`}
                        body={{ decision: "reject", reason: "Rejected after policy review" }}
                        label="Reject"
                        tone="danger"
                      />
                      <AdminActionButton
                        apiBaseUrl={baseUrl}
                        token={token}
                        endpoint={`/api/admin/jobs/${job.id}/review`}
                        body={{ decision: "escalate", reason: "Needs senior admin review" }}
                        label="Escalate"
                        tone="warning"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Disputes</p>
              <h3>Open and under-review cases</h3>
            </div>
            <span className="muted">Thread, evidence, and transaction metadata</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Case</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Thread</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {disputes.items.map((dispute) => (
                <tr key={dispute.id}>
                  <td>
                    <strong>{dispute.client}</strong>
                    <div className="muted">vs {dispute.freelancer}</div>
                  </td>
                  <td>
                    <span className={`badge badge--${statusClass(dispute.status)}`}>{dispute.status}</span>
                  </td>
                  <td>{dispute.amount}</td>
                  <td>{dispute.thread}</td>
                  <td>{dispute.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Controls</p>
              <h3>Platform switches</h3>
            </div>
            <span className="muted">Each toggle writes an audit entry</span>
          </div>
          <div className="control-grid">
            <div className="control-card">
              <div>
                <strong>New registrations</strong>
                <p className="muted">{controls.registrationsEnabled ? "Enabled" : "Disabled"}</p>
              </div>
              <AdminActionButton
                apiBaseUrl={baseUrl}
                token={token}
                endpoint="/api/admin/controls/registrationsEnabled"
                body={{ enabled: !controls.registrationsEnabled }}
                label={controls.registrationsEnabled ? "Disable" : "Enable"}
                tone={controls.registrationsEnabled ? "warning" : "neutral"}
              />
            </div>
            <div className="control-card">
              <div>
                <strong>New job postings</strong>
                <p className="muted">{controls.jobPostingsEnabled ? "Enabled" : "Disabled"}</p>
              </div>
              <AdminActionButton
                apiBaseUrl={baseUrl}
                token={token}
                endpoint="/api/admin/controls/jobPostingsEnabled"
                body={{ enabled: !controls.jobPostingsEnabled }}
                label={controls.jobPostingsEnabled ? "Disable" : "Enable"}
                tone={controls.jobPostingsEnabled ? "warning" : "neutral"}
              />
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Audit log</p>
              <h3>Recent actions</h3>
            </div>
            <span className="muted">Append-only admin history</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.items.map((entry) => (
                <tr key={`${entry.timestamp}-${entry.target}`}>
                  <td>{new Date(entry.timestamp).toLocaleString()}</td>
                  <td>{entry.adminId}</td>
                  <td>{entry.action}</td>
                  <td>{entry.target}</td>
                  <td>{entry.details}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="muted" style={{ marginTop: 12 }}>
            API base URL: {baseUrl}
          </div>
        </section>
      </section>
    );
  } catch (error) {
    const status = error instanceof Error && "status" in error ? (error as Error & { status?: number }).status : undefined;

    return (
      <section className="panel">
        <p className="eyebrow">Admin</p>
        <h2>{status === 403 ? "403 Admin access required" : "Admin panel unavailable"}</h2>
        <p className="muted">
          {status === 403
            ? "The supplied token does not carry the admin role."
            : error instanceof Error
              ? error.message
              : "Unable to load the admin panel."}
        </p>
      </section>
    );
  }
}
