const invoices = [
  { id: "inv-001", date: "2024-05-01", description: "Web Design Project", amount: 1500, status: "Paid" },
  { id: "inv-002", date: "2024-05-15", description: "API Integration Work", amount: 800, status: "Pending" },
  { id: "inv-003", date: "2024-06-01", description: "Code Review & Audit", amount: 450, status: "Paid" }
];

const payoutMethods = [
  { id: "pm-001", type: "Bank Account", label: "Chase ••••4821", primary: true },
  { id: "pm-002", type: "PayPal", label: "user@example.com", primary: false }
];

export default function BillingPage() {
  return (
    <section>
      <h2>Billing</h2>

      <h3>Invoices</h3>
      <div className="grid">
        {invoices.map((invoice) => (
          <article className="card" key={invoice.id}>
            <h4>{invoice.description}</h4>
            <p>{invoice.date}</p>
            <p>${invoice.amount.toLocaleString()}</p>
            <p>
              <strong>Status:</strong> {invoice.status}
            </p>
          </article>
        ))}
      </div>

      <h3>Payout Methods</h3>
      <div className="grid">
        {payoutMethods.map((method) => (
          <article className="card" key={method.id}>
            <h4>{method.type}</h4>
            <p>{method.label}</p>
            {method.primary && <p><strong>Primary</strong></p>}
          </article>
        ))}
      </div>
    </section>
  );
}
