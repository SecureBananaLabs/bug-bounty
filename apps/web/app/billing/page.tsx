const invoices = [
  { label: "Current balance", value: "$1,240", detail: "Due in 12 days" },
  { label: "Next payout", value: "$860", detail: "Scheduled for Friday" },
  { label: "Outstanding invoice", value: "$380", detail: "Net 7 terms" }
];

const payoutMethods = [
  { label: "Primary bank account", value: "Verified", detail: "Daily payouts enabled" },
  { label: "Fallback wallet", value: "Connected", detail: "Used if bank transfer fails" }
];

const transactions = [
  { date: "2026-06-09", type: "Payout", amount: "+$420", status: "Settled" },
  { date: "2026-06-08", type: "Invoice", amount: "-$180", status: "Open" },
  { date: "2026-06-07", type: "Payout", amount: "+$260", status: "Settled" },
  { date: "2026-06-05", type: "Fee", amount: "-$24", status: "Processed" }
];

export default function BillingPage() {
  return (
    <section>
      <h2>Billing</h2>
      <p>Track invoices, payout methods, and recent transfers without leaving the workflow.</p>

      <div className="grid">
        <article className="card">
          <h3>Invoice summary</h3>
          <ul>
            {invoices.map((invoice) => (
              <li key={invoice.label}>
                <strong>{invoice.label}:</strong> {invoice.value} <span>({invoice.detail})</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h3>Payout methods</h3>
          <ul>
            {payoutMethods.map((method) => (
              <li key={method.label}>
                <strong>{method.label}:</strong> {method.value} <span>({method.detail})</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h3>Transaction history</h3>
          <ul>
            {transactions.map((transaction) => (
              <li key={`${transaction.date}-${transaction.type}`}>
                <strong>{transaction.date}</strong> - {transaction.type} {transaction.amount} <span>({transaction.status})</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
