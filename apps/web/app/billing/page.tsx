const billingStats = [
  { label: "Available balance", value: "$4,820", detail: "Ready for payout" },
  { label: "In escrow", value: "$8,450", detail: "Across 6 active milestones" },
  { label: "Next payout", value: "Jun 14", detail: "Weekly transfer schedule" }
];

const invoices = [
  { id: "INV-2048", client: "Northstar Labs", amount: "$3,200", status: "Paid" },
  { id: "INV-2047", client: "Cobalt Studio", amount: "$1,850", status: "Processing" },
  { id: "INV-2046", client: "BrightOps", amount: "$975", status: "Due Jul 02" }
];

const payoutChecks = [
  "Primary payout method verified",
  "Tax profile complete",
  "No disputes blocking transfer"
];

const transferActivity = [
  { date: "Jun 07", label: "Weekly payout initiated", amount: "$4,820" },
  { date: "Jun 05", label: "Milestone released from escrow", amount: "$1,250" },
  { date: "Jun 03", label: "Invoice payment received", amount: "$3,200" }
];

export default function BillingPage() {
  return (
    <section>
      <div className="card">
        <h2>Billing</h2>
        <p>
          Review balances, payout readiness, recent invoices, and upcoming
          transfer activity from one workspace.
        </p>
      </div>

      <div className="grid">
        {billingStats.map((stat) => (
          <article className="card" key={stat.label}>
            <p>{stat.label}</p>
            <h3>{stat.value}</h3>
            <p>{stat.detail}</p>
          </article>
        ))}
      </div>

      <div className="grid">
        <section className="card">
          <h3>Recent invoices</h3>
          {invoices.map((invoice) => (
            <article key={invoice.id}>
              <h4>{invoice.id}</h4>
              <p>
                {invoice.client} - {invoice.amount} - {invoice.status}
              </p>
            </article>
          ))}
        </section>

        <section className="card">
          <h3>Payout setup</h3>
          <p>Bank transfer ending in 4421 is the primary payout destination.</p>
          <ul>
            {payoutChecks.map((check) => (
              <li key={check}>{check}</li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h3>Transfer activity</h3>
          {transferActivity.map((activity) => (
            <article key={`${activity.date}-${activity.label}`}>
              <h4>{activity.date}</h4>
              <p>
                {activity.label} - {activity.amount}
              </p>
            </article>
          ))}
        </section>
      </div>
    </section>
  );
}
