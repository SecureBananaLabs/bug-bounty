import { money, shortDate, statusClass } from "../format";
import type { Dispute, DisputeDetail, Page } from "../types";
import { EmptyState } from "./EmptyState";
import { PaginationControls } from "./PaginationControls";

type DisputesSectionProps = {
  disputes: Page<Dispute>;
  status: string;
  selectedDispute: DisputeDetail | null;
  busyAction: string;
  onStatusChange: (status: string) => void;
  onPageChange: (page: number) => void;
  onSelectDispute: (id: string) => void;
  onRule: (id: string, ruling: "client" | "freelancer" | "escalate") => void;
};

export function DisputesSection({
  disputes,
  status,
  selectedDispute,
  busyAction,
  onStatusChange,
  onPageChange,
  onSelectDispute,
  onRule
}: DisputesSectionProps) {
  return (
    <section className="admin-section" aria-labelledby="disputes-title">
      <div className="section-heading">
        <h3 id="disputes-title">Dispute Resolution</h3>
        <label className="compact-control">
          <span>Status</span>
          <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
            <option value="open">Open</option>
            <option value="under_review">Under review</option>
            <option value="resolved">Resolved</option>
            <option value="escalated">Escalated</option>
          </select>
        </label>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Case</th>
              <th scope="col">Parties</th>
              <th scope="col">Escrow</th>
              <th scope="col">Status</th>
              <th scope="col">Ruling</th>
            </tr>
          </thead>
          <tbody>
            {disputes.items.map((dispute) => (
              <tr key={dispute.id}>
                <td>
                  <button type="button" className="link-button" onClick={() => onSelectDispute(dispute.id)}>
                    {dispute.jobTitle}
                  </button>
                  <span className="muted">{dispute.summary}</span>
                </td>
                <td>
                  {dispute.clientName} / {dispute.freelancerName}
                </td>
                <td>{money(dispute.transaction.amount, dispute.transaction.currency)}</td>
                <td>
                  <span className={statusClass(dispute.status)}>{dispute.status}</span>
                </td>
                <td className="action-cell">
                  <button type="button" disabled={busyAction !== ""} onClick={() => onRule(dispute.id, "client")}>
                    Client
                  </button>
                  <button type="button" disabled={busyAction !== ""} onClick={() => onRule(dispute.id, "freelancer")}>
                    Freelancer
                  </button>
                  <button type="button" disabled={busyAction !== ""} onClick={() => onRule(dispute.id, "escalate")}>
                    Escalate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {disputes.items.length === 0 ? <EmptyState label="No disputes match this status." /> : null}
      <PaginationControls pagination={disputes.pagination} onPageChange={onPageChange} />

      <div className="detail-panel" aria-live="polite">
        <h4>Selected dispute</h4>
        {selectedDispute ? (
          <div className="detail-grid">
            <div>
              <strong>{selectedDispute.jobTitle}</strong>
              <p>{selectedDispute.summary}</p>
              <p className="muted">
                Opened {shortDate(selectedDispute.openedAt)} - {selectedDispute.transaction.escrowStatus}
              </p>
            </div>
            <div>
              <h5>Thread</h5>
              {selectedDispute.thread.length === 0 ? (
                <p className="muted">No thread entries.</p>
              ) : (
                <ul className="compact-list">
                  {selectedDispute.thread.map((entry) => (
                    <li key={`${entry.authorId}-${entry.createdAt}`}>
                      <strong>{entry.authorId}</strong>: {entry.body}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h5>Evidence</h5>
              {selectedDispute.evidence.length === 0 ? (
                <p className="muted">No evidence files.</p>
              ) : (
                <ul className="compact-list">
                  {selectedDispute.evidence.map((item) => (
                    <li key={item.id}>
                      {item.label} ({item.type})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <EmptyState label="Select a dispute to inspect the full thread, evidence, and transaction." />
        )}
      </div>
    </section>
  );
}
