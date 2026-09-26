export default function BillingPage() {
  const invoices = [
    { id: "INV-1042", client: "Northstar Labs", amount: "$1,500", status: "Due soon" },
    { id: "INV-1041", client: "Atlas Studio", amount: "$850", status: "Paid" }
  ];

  const transactions = [
    { date: "May 28", description: "Milestone payout - API migration", amount: "+$2,800" },
    { date: "May 24", description: "Platform fee - SaaS onboarding", amount: "-$45" },
    { date: "May 20", description: "Invoice payment - Support widget", amount: "+$1,500" }
  ];

  return (
    <section>
      <div className="section-header">
        <h2>Billing</h2>
        <p>Review outstanding invoices, payout settings, and recent money movement.</p>
      </div>

      <div className="metric-grid">
        <article className="card">
          <span className="eyebrow">Available balance</span>
          <strong className="metric">$4,250</strong>
          <p>Ready for payout after the next settlement run.</p>
        </article>
        <article className="card">
          <span className="eyebrow">Open invoices</span>
          <strong className="metric">$1,500</strong>
          <p>One client invoice is due within seven days.</p>
        </article>
        <article className="card">
          <span className="eyebrow">Escrowed milestones</span>
          <strong className="metric">$3,700</strong>
          <p>Two active jobs are waiting on client approval.</p>
        </article>
      </div>

      <div className="billing-layout">
        <article className="card">
          <h3>Invoices</h3>
          <div className="stack">
            {invoices.map((invoice) => (
              <div className="row" key={invoice.id}>
                <div>
                  <strong>{invoice.id}</strong>
                  <p>{invoice.client}</p>
                </div>
                <div className="row-end">
                  <strong>{invoice.amount}</strong>
                  <span className={`status ${invoice.status === "Paid" ? "paid" : ""}`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <h3>Payout method</h3>
          <div className="payout-method">
            <span className="status paid">Active</span>
            <strong>USDC wallet ending 81593a6</strong>
            <p>Default payout method for completed contracts and released milestones.</p>
          </div>
        </article>
      </div>

      <article className="card">
        <h3>Recent transactions</h3>
        <div className="stack">
          {transactions.map((transaction) => (
            <div className="row" key={`${transaction.date}-${transaction.description}`}>
              <div>
                <strong>{transaction.description}</strong>
                <p>{transaction.date}</p>
              </div>
              <strong>{transaction.amount}</strong>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
