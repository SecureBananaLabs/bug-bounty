const billingStats = [
  { label: "Open invoices", value: "3", detail: "$4,280 due this month" },
  { label: "Next payout", value: "$1,940", detail: "Scheduled for Friday" },
  { label: "Pending review", value: "2", detail: "Transactions need approval" },
];

const invoices = [
  { id: "INV-1042", client: "Northstar Labs", amount: "$1,200", status: "Due Aug 2" },
  { id: "INV-1041", client: "Brightline Studio", amount: "$2,480", status: "Processing" },
  { id: "INV-1040", client: "Urban Health", amount: "$600", status: "Paid" },
];

const transactions = [
  "Review failed card charge for INV-1042",
  "Confirm payout method before next payout window",
  "Export July transaction history for accounting",
];

export default function BillingPage() {
  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <h2>Billing</h2>
          <p>Track invoices, payout readiness, and recent transaction activity from one place.</p>
        </div>
        <a
          href="/billing"
          style={{ border: "1px solid #4d63a3", borderRadius: "999px", padding: "0.5rem 0.75rem", fontWeight: 700 }}
        >
          Export report
        </a>
      </div>

      <div className="grid" style={{ marginTop: "1rem" }}>
        {billingStats.map((stat) => (
          <article key={stat.label} className="card" style={{ marginBottom: 0 }}>
            <p style={{ margin: 0, color: "#aab6df" }}>{stat.label}</p>
            <strong style={{ display: "block", fontSize: "1.75rem", margin: "0.35rem 0" }}>{stat.value}</strong>
            <span style={{ color: "#cad3f5" }}>{stat.detail}</span>
          </article>
        ))}
      </div>

      <div className="grid" style={{ marginTop: "1rem" }}>
        <article className="card" style={{ marginBottom: 0 }}>
          <h3>Invoice queue</h3>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.75rem", borderTop: "1px solid #2a3765", paddingTop: "0.75rem" }}
              >
                <div>
                  <strong>{invoice.id}</strong>
                  <p style={{ margin: "0.2rem 0 0", color: "#aab6df" }}>{invoice.client}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong>{invoice.amount}</strong>
                  <p style={{ margin: "0.2rem 0 0", color: "#aab6df" }}>{invoice.status}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card" style={{ marginBottom: 0 }}>
          <h3>Payout method</h3>
          <p style={{ color: "#cad3f5" }}>Primary payout account is verified and ready for the next payout cycle.</p>
          <div style={{ borderTop: "1px solid #2a3765", paddingTop: "0.75rem" }}>
            <strong>Bank transfer ending in 4821</strong>
            <p style={{ margin: "0.2rem 0 0", color: "#aab6df" }}>Last updated 12 days ago</p>
          </div>
        </article>
      </div>

      <article className="card" style={{ marginTop: "1rem", marginBottom: 0 }}>
        <h3>Transaction actions</h3>
        <ul style={{ marginBottom: 0, paddingLeft: "1.25rem" }}>
          {transactions.map((transaction) => (
            <li key={transaction} style={{ marginBottom: "0.5rem" }}>{transaction}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}
