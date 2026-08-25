const MOCK_INVOICES = [
  { id: "inv_001", description: "React Dashboard — Milestone 1", amount: 500, status: "paid", date: "Jun 1, 2025" },
  { id: "inv_002", description: "API Integration", amount: 400, status: "pending", date: "Jun 10, 2025" }
];

const MOCK_PAYOUTS = [
  { id: "pay_001", method: "Bank Transfer", amount: 500, date: "Jun 5, 2025" }
];

export default function BillingPage() {
  return (
    <section className="card">
      <h2>Billing</h2>

      <h3>Invoices</h3>
      <ul>
        {MOCK_INVOICES.map(i => (
          <li key={i.id}>
            {i.description} — ${i.amount} — {i.status} — {i.date}
          </li>
        ))}
      </ul>

      <h3>Payouts</h3>
      <ul>
        {MOCK_PAYOUTS.map(p => (
          <li key={p.id}>
            {p.method} — ${p.amount} — {p.date}
          </li>
        ))}
      </ul>
    </section>
  );
}
