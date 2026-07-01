const metrics = [
  {
    label: "Available balance",
    value: "$8,420",
    detail: "Ready for payout",
    tone: "positive",
  },
  {
    label: "Pending escrow",
    value: "$3,150",
    detail: "Across 4 milestones",
    tone: "warning",
  },
  {
    label: "Next invoice",
    value: "$1,280",
    detail: "Due Jun 03",
    tone: "neutral",
  },
];

const transactions = [
  {
    id: "INV-2048",
    client: "Northstar Labs",
    type: "Milestone funded",
    amount: "$2,400",
    status: "Cleared",
  },
  {
    id: "PAY-1942",
    client: "BrightLayer",
    type: "Payout",
    amount: "-$1,250",
    status: "In transit",
  },
  {
    id: "INV-2039",
    client: "Atlas Cloud",
    type: "Invoice",
    amount: "$980",
    status: "Due soon",
  },
];

const payoutMethods = [
  { name: "Stripe balance", detail: "Primary payout rail", status: "Verified" },
  { name: "Business checking", detail: "Ends in 4821", status: "Ready" },
];

export default function BillingPage() {
  return (
    <section className="billing-page">
      <div className="billing-header">
        <div>
          <p className="eyebrow">Billing</p>
          <h2>Payments, payouts, and escrow</h2>
          <p className="billing-intro">
            Track funds moving through the marketplace before invoices,
            milestones, or payouts need attention.
          </p>
        </div>
        <div className="billing-cycle">
          <span>Current cycle</span>
          <strong>May 2026</strong>
        </div>
      </div>

      <div className="billing-kpis" aria-label="Billing summary">
        {metrics.map((metric) => (
          <article
            className={`billing-panel metric-card ${metric.tone}`}
            key={metric.label}
          >
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.detail}</p>
          </article>
        ))}
      </div>

      <div className="billing-layout">
        <section
          className="billing-panel billing-ledger"
          aria-labelledby="recent-activity"
        >
          <div className="section-heading">
            <div>
              <h3 id="recent-activity">Recent activity</h3>
              <p>Latest invoice, escrow, and payout events.</p>
            </div>
            <span className="status-pill">3 updates</span>
          </div>

          <div className="ledger-list">
            {transactions.map((transaction) => (
              <div className="ledger-row" key={transaction.id}>
                <div>
                  <strong>{transaction.client}</strong>
                  <span>
                    {transaction.id} - {transaction.type}
                  </span>
                </div>
                <div className="ledger-amount">
                  <strong>{transaction.amount}</strong>
                  <span>{transaction.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside
          className="billing-panel payout-panel"
          aria-labelledby="payout-methods"
        >
          <div className="section-heading">
            <div>
              <h3 id="payout-methods">Payout methods</h3>
              <p>Verified destinations available for the next payout run.</p>
            </div>
          </div>

          <div className="method-list">
            {payoutMethods.map((method) => (
              <div className="method-row" key={method.name}>
                <div>
                  <strong>{method.name}</strong>
                  <span>{method.detail}</span>
                </div>
                <span className="status-pill">{method.status}</span>
              </div>
            ))}
          </div>

          <div className="billing-note">
            <span>Next automatic payout</span>
            <strong>Friday, 09:00 UTC</strong>
          </div>
        </aside>
      </div>
    </section>
  );
}
