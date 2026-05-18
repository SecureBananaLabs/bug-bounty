import { shortDate, statusClass } from "../format";
import type { Page, User, UserDetail, UserFilters, UserRole, UserStatus } from "../types";
import { EmptyState } from "./EmptyState";
import { PaginationControls } from "./PaginationControls";

type UsersSectionProps = {
  users: Page<User>;
  filters: UserFilters;
  selectedUser: UserDetail | null;
  busyAction: string;
  onFilterChange: (filters: UserFilters) => void;
  onPageChange: (page: number) => void;
  onSelectUser: (id: string) => void;
  onStatusChange: (id: string, status: UserStatus) => void;
};

export function UsersSection({
  users,
  filters,
  selectedUser,
  busyAction,
  onFilterChange,
  onPageChange,
  onSelectUser,
  onStatusChange
}: UsersSectionProps) {
  const updateFilters = (patch: Partial<UserFilters>) => onFilterChange({ ...filters, ...patch });

  return (
    <div className="admin-layout">
      <section className="admin-section" aria-labelledby="users-title">
        <div className="section-heading">
          <h3 id="users-title">User Management</h3>
          <span>{users.pagination.totalItems} records</span>
        </div>

        <div className="filter-row filter-row-wide">
          <label>
            <span>Search</span>
            <input
              value={filters.search}
              onChange={(event) => updateFilters({ search: event.target.value })}
              placeholder="Name, email, location"
            />
          </label>
          <label>
            <span>Role</span>
            <select value={filters.role} onChange={(event) => updateFilters({ role: event.target.value as "all" | UserRole })}>
              <option value="all">All roles</option>
              <option value="client">Clients</option>
              <option value="freelancer">Freelancers</option>
            </select>
          </label>
          <label>
            <span>Status</span>
            <select
              value={filters.status}
              onChange={(event) => updateFilters({ status: event.target.value as "all" | UserStatus })}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </label>
          <label>
            <span>Joined from</span>
            <input type="date" value={filters.joinedFrom} onChange={(event) => updateFilters({ joinedFrom: event.target.value })} />
          </label>
          <label>
            <span>Joined to</span>
            <input type="date" value={filters.joinedTo} onChange={(event) => updateFilters({ joinedTo: event.target.value })} />
          </label>
        </div>

        {users.items.length === 0 ? (
          <EmptyState label="No users match the current filters." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">User</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Trust</th>
                  <th scope="col">Joined</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.items.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <button type="button" className="link-button" onClick={() => onSelectUser(user.id)}>
                        {user.fullName}
                      </button>
                      <span className="muted">{user.email}</span>
                    </td>
                    <td>{user.role}</td>
                    <td>
                      <span className={statusClass(user.status)}>{user.status}</span>
                    </td>
                    <td>{user.trustScore}</td>
                    <td>{shortDate(user.joinedAt)}</td>
                    <td className="action-cell">
                      <button
                        type="button"
                        disabled={busyAction !== ""}
                        onClick={() => onStatusChange(user.id, "suspended")}
                      >
                        Suspend
                      </button>
                      <button
                        type="button"
                        disabled={busyAction !== ""}
                        onClick={() => onStatusChange(user.id, "active")}
                      >
                        Reinstate
                      </button>
                      <button
                        type="button"
                        className="danger"
                        disabled={busyAction !== ""}
                        onClick={() => onStatusChange(user.id, "banned")}
                      >
                        Ban
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <PaginationControls pagination={users.pagination} onPageChange={onPageChange} />
      </section>

      <aside className="admin-side-panel" aria-labelledby="profile-title">
        <h3 id="profile-title">Profile Review</h3>
        {selectedUser ? (
          <>
            <dl>
              <div>
                <dt>Name</dt>
                <dd>{selectedUser.profile.fullName}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{selectedUser.profile.location}</dd>
              </div>
              <div>
                <dt>Trust score</dt>
                <dd>{selectedUser.profile.trustScore}</dd>
              </div>
            </dl>
            <h4>Active jobs</h4>
            {selectedUser.activeJobs.length === 0 ? (
              <p className="muted">No active jobs.</p>
            ) : (
              <ul className="compact-list">
                {selectedUser.activeJobs.map((job) => (
                  <li key={job.id}>{job.title}</li>
                ))}
              </ul>
            )}
            <h4>Dispute history</h4>
            {selectedUser.disputeHistory.length === 0 ? (
              <p className="muted">No dispute history.</p>
            ) : (
              <ul className="compact-list">
                {selectedUser.disputeHistory.map((dispute) => (
                  <li key={dispute.id}>
                    {dispute.jobTitle} - {dispute.status}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <EmptyState label="Select a user." />
        )}
      </aside>
    </div>
  );
}
