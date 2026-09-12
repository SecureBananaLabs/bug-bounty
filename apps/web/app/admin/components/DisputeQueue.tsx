import type { Dispute } from "../../../lib/adminTypes";

type Props = {
  disputes: Dispute[];
  onRuling: (disputeId: string, ruling: "favor_client" | "favor_freelancer" | "refund" | "escalate") => void;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

export function DisputeQueue({ disputes, onRuling }: Props) {
  return (
    <section className="admin-section" id="admin-disputes" aria-labelledby="admin-disputes-title">
      <div className="admin-section-heading">
        <div>
          <p className="admin-eyebrow">Dispute resolution</p>
          <h2 id="admin-disputes-title">Open cases</h2>
        </div>
      </div>
      <div className="admin-list">
        {disputes.map((dispute) => (
          <article className="admin-list-item" key={dispute.id}>
            <div>
              <div className="admin-list-title">
                <strong>{dispute.jobTitle}</strong>
                <span className="admin-pill">{dispute.status}</span>
              </div>
              <p>{dispute.summary}</p>
              <span>
                {dispute.clientName} / {dispute.freelancerName} /{" "}
                {currencyFormatter.format(dispute.amount)} / {dispute.evidenceCount} files
              </span>
            </div>
            <div className="admin-action-row">
              <button
                type="button"
                onClick={() => onRuling(dispute.id, "favor_client")}
                aria-label={`Rule for client on ${dispute.jobTitle}`}
              >
                Client
              </button>
              <button
                type="button"
                onClick={() => onRuling(dispute.id, "favor_freelancer")}
                aria-label={`Rule for freelancer on ${dispute.jobTitle}`}
              >
                Freelancer
              </button>
              <button
                type="button"
                onClick={() => onRuling(dispute.id, "escalate")}
                aria-label={`Escalate dispute ${dispute.jobTitle}`}
              >
                Escalate
              </button>
            </div>
          </article>
        ))}
        {disputes.length === 0 ? <p className="admin-empty-state">No open disputes.</p> : null}
      </div>
    </section>
  );
}
