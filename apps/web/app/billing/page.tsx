const mockInvoices = [
  { id: "inv-001", amount: "$500", status: "Paid", date: "2026-05-01" },
  { id: "inv-002", amount: "$1,200", status: "Pending", date: "2026-06-01" }
];

export default function BillingPage() {
  return (
    <section className="card">
      <h2>Billing</h2>
      <h3>Invoices</h3>
      <ul>
        {mockInvoices.map(inv => (
          <li key={inv.id}>
            {inv.date} — {inv.amount} — <strong>{inv.status}</strong> (#{inv.id})
          </li>
        ))}
      </ul>
      <h3>Payout method</h3>
      <p>Bank account ending in <strong>4242</strong></p>
    </section>
  );
}
