import { money, statusClass } from "../format";
import type { Listing, ModerationStatus, Page } from "../types";
import { EmptyState } from "./EmptyState";
import { PaginationControls } from "./PaginationControls";

type ModerationSectionProps = {
  listings: Page<Listing>;
  status: string;
  busyAction: string;
  onStatusChange: (status: string) => void;
  onPageChange: (page: number) => void;
  onDecision: (id: string, decision: "approve" | "reject" | "escalate") => void;
};

export function ModerationSection({
  listings,
  status,
  busyAction,
  onStatusChange,
  onPageChange,
  onDecision
}: ModerationSectionProps) {
  return (
    <section className="admin-section" aria-labelledby="moderation-title">
      <div className="section-heading">
        <h3 id="moderation-title">Job Moderation</h3>
        <label className="compact-control">
          <span>Status</span>
          <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
            <option value="flagged">Flagged</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="escalated">Escalated</option>
          </select>
        </label>
      </div>
      <div className="queue-grid">
        {listings.items.length === 0 ? (
          <EmptyState label="No listings match this moderation status." />
        ) : (
          listings.items.map((listing) => (
            <article key={listing.id} className="queue-item">
              <div>
                <h4>{listing.title}</h4>
                <p>{listing.clientName}</p>
              </div>
              <span className={statusClass(listing.moderationStatus as ModerationStatus)}>
                {listing.moderationStatus}
              </span>
              <p>{listing.flagReason}</p>
              <p className="muted">
                {listing.reports} reports - {money(listing.budget)}
              </p>
              {listing.automatedFlags?.length ? (
                <p className="muted">Rules: {listing.automatedFlags.join(", ")}</p>
              ) : null}
              <div className="button-row">
                <button type="button" disabled={busyAction !== ""} onClick={() => onDecision(listing.id, "approve")}>
                  Approve
                </button>
                <button type="button" disabled={busyAction !== ""} onClick={() => onDecision(listing.id, "escalate")}>
                  Escalate
                </button>
                <button
                  type="button"
                  className="danger"
                  disabled={busyAction !== ""}
                  onClick={() => onDecision(listing.id, "reject")}
                >
                  Reject
                </button>
              </div>
            </article>
          ))
        )}
      </div>
      <PaginationControls pagination={listings.pagination} onPageChange={onPageChange} />
    </section>
  );
}
