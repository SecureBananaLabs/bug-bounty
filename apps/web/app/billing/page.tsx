const invoiceSummary = [
  { label: "Open invoices", value: "2", detail: "$4,300 awaiting payment" },
  { label: "Next payout", value: "$1,850", detail: "Scheduled for Friday" },
  { label: "Escrow balance", value: "$7,200", detail: "Across 4 active milestones" }
];

const transactions = [
  { id: "INV-1042", client: "Northstar Labs", status: "Due in 5 days", amount: "$2,800" },
  { id: "INV-1039", client: "Mosaic Studio", status: "Overdue", amount: "$1,500" },
  { id: "PAY-882", client: "Platform payout", status: "Processing", amount: "$1,850" }
];

export default function BillingPage() {
  return (
    <section>
      <div className="card">
        <h2>Billing</h2>
        <p>Review invoice health, payout timing, and account funding from one workspace.</p>
      </div>

      <div className="grid" aria-label="Billing summary">
        {invoiceSummary.map((item) => (
          <article className="card" key={item.label}>
            <p>{item.label}</p>
            <h3>{item.value}</h3>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>

      <div className="grid">
        <section className="card">
          <h3>Payout method</h3>
          <p>Wise USD account ending in 2841</p>
          <p>Backup method: PayPal billing@freelanceflow.test</p>
          <button className="billing-button" type="button">Update payout method</button>
        </section>

        <section className="card">
          <h3>Billing actions</h3>
          <button className="billing-button" type="button">Send payment reminder</button>
          <button className="billing-button" type="button">Download invoices</button>
          <button className="billing-button" type="button">Add billing contact</button>
        </section>
      </div>

      <section className="card">
        <h3>Recent activity</h3>
        <div className="billing-list">
          {transactions.map((transaction) => (
            <div className="billing-row" key={transaction.id}>
              <div>
                <strong>{transaction.id}</strong>
                <p>{transaction.client}</p>
              </div>
              <p>{transaction.status}</p>
              <strong>{transaction.amount}</strong>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
