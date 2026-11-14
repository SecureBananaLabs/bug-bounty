import type { FlaggedListing } from "../../../lib/adminTypes";

type Props = {
  listings: FlaggedListing[];
  onDecision: (listingId: string, decision: "approve" | "reject" | "escalate") => void;
};

export function ModerationQueue({ listings, onDecision }: Props) {
  return (
    <section className="admin-section" id="admin-moderation" aria-labelledby="admin-moderation-title">
      <div className="admin-section-heading">
        <div>
          <p className="admin-eyebrow">Job moderation</p>
          <h2 id="admin-moderation-title">Flagged listings</h2>
        </div>
      </div>
      <div className="admin-list">
        {listings.map((listing) => (
          <article className="admin-list-item" key={listing.id}>
            <div>
              <div className="admin-list-title">
                <strong>{listing.title}</strong>
                <span className={`admin-pill admin-risk-${listing.riskLevel}`}>{listing.riskLevel}</span>
              </div>
              <p>{listing.reason}</p>
              <span>{listing.ownerName}</span>
            </div>
            <div className="admin-action-row">
              <button
                type="button"
                onClick={() => onDecision(listing.id, "approve")}
                aria-label={`Approve ${listing.title}`}
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => onDecision(listing.id, "reject")}
                aria-label={`Reject ${listing.title}`}
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => onDecision(listing.id, "escalate")}
                aria-label={`Escalate ${listing.title}`}
              >
                Escalate
              </button>
            </div>
          </article>
        ))}
        {listings.length === 0 ? <p className="admin-empty-state">No flagged listings.</p> : null}
      </div>
    </section>
  );
}
