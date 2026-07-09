const invoices = [
  { id: "INV-1042", date: "May 14, 2026", amount: "$1,250", status: "Paid" },
  { id: "INV-1037", date: "Apr 16, 2026", amount: "$820", status: "Paid" },
  { id: "INV-1029", date: "Mar 18, 2026", amount: "$1,480", status: "Paid" }
];

const transactions = [
  { label: "AI customer support widget", date: "May 20, 2026", amount: "-$750" },
  { label: "Milestone payout received", date: "May 18, 2026", amount: "+$1,250" },
  { label: "Platform service fee", date: "May 14, 2026", amount: "-$48" }
];

export default function BillingPage() {
  return (
    <section className="card">
      <h2>Billing</h2>

      <div className="grid">
        <div>
          <h3>Account balance</h3>
          <p style={{ fontSize: "1.8rem", margin: "0.25rem 0" }}>$2,432</p>
          <p>Available for freelancer payouts and client invoices.</p>
        </div>
        <div>
          <h3>Payment method</h3>
          <p style={{ fontSize: "1.1rem", margin: "0.25rem 0" }}>Visa ending 4242</p>
          <p>Backup: bank transfer ending 9182.</p>
        </div>
        <div>
          <h3>Next billing date</h3>
          <p style={{ fontSize: "1.1rem", margin: "0.25rem 0" }}>June 14, 2026</p>
          <p>Estimated platform fees: $52.</p>
        </div>
      </div>

      <h3>Invoices</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1rem" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #2a3765" }}>Invoice</th>
            <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #2a3765" }}>Date</th>
            <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #2a3765" }}>Amount</th>
            <th style={{ textAlign: "left", padding: "0.5rem", borderBottom: "1px solid #2a3765" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td style={{ padding: "0.5rem" }}>{invoice.id}</td>
              <td style={{ padding: "0.5rem" }}>{invoice.date}</td>
              <td style={{ padding: "0.5rem" }}>{invoice.amount}</td>
              <td style={{ padding: "0.5rem" }}>{invoice.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Recent transactions</h3>
      <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
        {transactions.map((transaction) => (
          <li key={`${transaction.label}-${transaction.date}`}>
            <strong>{transaction.amount}</strong> {transaction.label} <span>({transaction.date})</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
