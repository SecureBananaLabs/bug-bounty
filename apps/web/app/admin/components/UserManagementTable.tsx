import type { AdminUser } from "../../../lib/adminTypes";

type Props = {
  users: AdminUser[];
  roleFilter: string;
  statusFilter: string;
  search: string;
  onRoleFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onStatusAction: (userId: string, action: "suspend" | "reinstate" | "ban") => void;
};

export function UserManagementTable({
  users,
  roleFilter,
  statusFilter,
  search,
  onRoleFilterChange,
  onStatusFilterChange,
  onSearchChange,
  onStatusAction
}: Props) {
  return (
    <section className="admin-section" id="admin-users" aria-labelledby="admin-users-title">
      <div className="admin-section-heading">
        <div>
          <p className="admin-eyebrow">User management</p>
          <h2 id="admin-users-title">Accounts</h2>
        </div>
        <div className="admin-filter-row" role="search">
          <label>
            <span>Search</span>
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Name or email"
            />
          </label>
          <label>
            <span>Role</span>
            <select value={roleFilter} onChange={(event) => onRoleFilterChange(event.target.value)}>
              <option value="all">All</option>
              <option value="client">Clients</option>
              <option value="freelancer">Freelancers</option>
              <option value="admin">Admins</option>
            </select>
          </label>
          <label>
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </label>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">User</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
              <th scope="col">Trust</th>
              <th scope="col">Activity</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <strong>{user.fullName}</strong>
                  <span>{user.email}</span>
                </td>
                <td>{user.role}</td>
                <td>
                  <span className={`admin-pill admin-pill-${user.status}`}>{user.status}</span>
                </td>
                <td>{user.trustScore}</td>
                <td>
                  {user.activeJobs} jobs / {user.disputeCount} disputes
                </td>
                <td>
                  <div className="admin-action-row">
                    <button
                      type="button"
                      onClick={() => onStatusAction(user.id, "suspend")}
                      aria-label={`Suspend ${user.fullName}`}
                      disabled={user.status === "suspended" || user.status === "banned"}
                    >
                      Suspend
                    </button>
                    <button
                      type="button"
                      onClick={() => onStatusAction(user.id, "reinstate")}
                      aria-label={`Reinstate ${user.fullName}`}
                      disabled={user.status === "active"}
                    >
                      Reinstate
                    </button>
                    <button
                      type="button"
                      onClick={() => onStatusAction(user.id, "ban")}
                      aria-label={`Ban ${user.fullName}`}
                      disabled={user.status === "banned"}
                    >
                      Ban
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-empty-state">
                  No users found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
