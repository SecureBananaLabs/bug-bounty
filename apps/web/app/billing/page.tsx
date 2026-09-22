const payoutMethod = {
  label: "Stripe Connect",
  account: "Connected account ending in 4821",
  status: "Ready",
  nextAction: "Review payout"
};

const invoices = [
  { id: "INV-2048", client: "Northstar Labs", amount: "$2,800", due: "Due Jun 04", status: "Pending" },
  { id: "INV-2047", client: "Atlas Studio", amount: "$1,500", due: "Paid May 28", status: "Paid" },
  { id: "INV-2046", client: "Mercury Ops", amount: "$900", due: "Paid May 19", status: "Paid" }
];

const transactions = [
  { id: "TRX-9102", label: "Milestone escrow release", amount: "+$1,500", date: "May 28" },
  { id: "TRX-9101", label: "Platform service fee", amount: "-$75", date: "May 28" },
  { id: "TRX-9098", label: "Payout transfer", amount: "-$2,225", date: "May 21" }
];

export default function BillingPage() {
  return (
    <section>
      <div className="page-heading">
        <div>
          <h2>Billing</h2>
          <p>Account balance, invoices, payout method, and recent transactions.</p>
        </div>
        <button type="button">Download statement</button>
      </div>

      <div className="billing-summary">
        <article className="card metric-card">
          <span className="eyebrow">Available balance</span>
          <strong>$3,225</strong>
          <span className="muted">Ready for next payout</span>
        </article>
        <article className="card metric-card">
          <span className="eyebrow">Pending invoices</span>
          <strong>$2,800</strong>
          <span className="muted">1 invoice awaiting client payment</span>
        </article>
        <article className="card metric-card">
          <span className="eyebrow">Next payout</span>
          <strong>Jun 07</strong>
          <span className="muted">Weekly payout schedule</span>
        </article>
      </div>

      <div className="billing-layout">
        <section className="card">
          <div className="section-title">
            <h3>Invoices</h3>
            <button type="button">Create invoice</button>
          </div>
          <div className="list">
            {invoices.map((invoice) => (
              <article className="row-item" key={invoice.id}>
                <div>
                  <strong>{invoice.id}</strong>
                  <span>{invoice.client}</span>
                </div>
                <div className="row-meta">
                  <strong>{invoice.amount}</strong>
                  <span>{invoice.due}</span>
                </div>
                <span className={`status-chip ${invoice.status === "Paid" ? "status-paid" : "status-pending"}`}>
                  {invoice.status}
                </span>
              </article>
            ))}
          </div>
        </section>

        <aside className="card">
          <div className="section-title">
            <h3>Payout method</h3>
            <span className="status-chip status-paid">{payoutMethod.status}</span>
          </div>
          <div className="payout-panel">
            <strong>{payoutMethod.label}</strong>
            <span>{payoutMethod.account}</span>
            <button type="button">{payoutMethod.nextAction}</button>
          </div>
        </aside>
      </div>

      <section className="card">
        <div className="section-title">
          <h3>Transaction history</h3>
          <button type="button">Export CSV</button>
        </div>
        <div className="list">
          {transactions.map((transaction) => (
            <article className="row-item" key={transaction.id}>
              <div>
                <strong>{transaction.label}</strong>
                <span>{transaction.id}</span>
              </div>
              <div className="row-meta">
                <strong>{transaction.amount}</strong>
                <span>{transaction.date}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
