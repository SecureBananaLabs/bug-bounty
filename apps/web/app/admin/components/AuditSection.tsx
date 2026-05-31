import { shortDate } from "../format";
import type { AuditFilters, AuditLog, Page } from "../types";
import { EmptyState } from "./EmptyState";
import { PaginationControls } from "./PaginationControls";

type AuditSectionProps = {
  auditLogs: Page<AuditLog>;
  filters: AuditFilters;
  actionTypes: string[];
  onFilterChange: (filters: AuditFilters) => void;
  onPageChange: (page: number) => void;
};

export function AuditSection({ auditLogs, filters, actionTypes, onFilterChange, onPageChange }: AuditSectionProps) {
  const updateFilters = (patch: Partial<AuditFilters>) => onFilterChange({ ...filters, ...patch });

  return (
    <section className="admin-section" aria-labelledby="audit-title">
      <div className="section-heading">
        <h3 id="audit-title">Audit Log</h3>
      </div>
      <div className="filter-row audit-filter-row">
        <label>
          <span>Action</span>
          <select value={filters.actionType} onChange={(event) => updateFilters({ actionType: event.target.value })}>
            <option value="all">All actions</option>
            {actionTypes.map((type) => (
              <option value={type} key={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Admin</span>
          <input
            value={filters.admin}
            onChange={(event) => updateFilters({ admin: event.target.value })}
            placeholder="admin id"
          />
        </label>
        <label>
          <span>From</span>
          <input type="date" value={filters.from} onChange={(event) => updateFilters({ from: event.target.value })} />
        </label>
        <label>
          <span>To</span>
          <input type="date" value={filters.to} onChange={(event) => updateFilters({ to: event.target.value })} />
        </label>
      </div>
      {auditLogs.items.length === 0 ? (
        <EmptyState label="No audit records match the filter." />
      ) : (
        <ol className="audit-list">
          {auditLogs.items.map((log) => (
            <li key={log.id}>
              <span>{shortDate(log.createdAt)}</span>
              <strong>{log.actionType}</strong>
              <p>{log.summary}</p>
              <em>
                {log.adminId} - {log.targetType}:{log.targetId}
              </em>
            </li>
          ))}
        </ol>
      )}
      <PaginationControls pagination={auditLogs.pagination} onPageChange={onPageChange} />
    </section>
  );
}
