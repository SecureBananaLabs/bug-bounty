export default function BillingPage() {
  const summary = [
    ["Available balance", "$8,420", "Ready for next payout"],
    ["Pending escrow", "$3,150", "2 milestones awaiting approval"],
    ["Next payout", "Jun 14", "ACH transfer to verified account"]
  ];

  const invoices = [
    ["INV-1048", "Mobile checkout polish", "$2,400", "Due Jun 18", "Open"],
    ["INV-1041", "Dashboard analytics sprint", "$4,800", "Paid Jun 02", "Paid"],
    ["INV-1037", "Brand system handoff", "$1,220", "Due May 29", "Review"]
  ];

  const transactions = [
    ["Escrow funded", "Client deposit for checkout milestone", "+$1,500"],
    ["Payout sent", "Weekly payout batch", "-$3,260"],
    ["Invoice paid", "Dashboard analytics sprint", "+$4,800"]
  ];

  return (
    <section>
      <div className="card">
        <h2>Billing</h2>
        <p>Track balances, invoices, escrow movement, and payout readiness from one account view.</p>
      </div>

      <div className="grid">
        {summary.map(([label, value, detail]) => (
          <article className="card" key={label}>
            <p>{label}</p>
            <h3>{value}</h3>
            <p>{detail}</p>
          </article>
        ))}
      </div>

      <div className="card">
        <h3>Payout Method</h3>
        <p>Verified bank account ending in 4821. Automatic payouts are enabled for approved balances.</p>
        <p>Next action: confirm tax profile before the next quarterly threshold review.</p>
      </div>

      <section>
        <h3>Invoices</h3>
        <div className="grid">
          {invoices.map(([id, project, amount, timing, status]) => (
            <article className="card" key={id}>
              <h4>{id}</h4>
              <p>{project}</p>
              <p>{amount}</p>
              <p>{timing}</p>
              <strong>{status}</strong>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h3>Recent Activity</h3>
        <div className="grid">
          {transactions.map(([event, detail, amount]) => (
            <article className="card" key={`${event}-${amount}`}>
              <h4>{event}</h4>
              <p>{detail}</p>
              <strong>{amount}</strong>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
