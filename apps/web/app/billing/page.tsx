export default function BillingPage() {
  return (
    <section className="card">
      <h2>Billing</h2>
      <div style={{ display: "grid", gap: "0.5rem" }}>
        <p>Current balance: $420.00</p>
        <p>Primary payout method: Bank account ending in 0042</p>
        <p>Latest invoice: FreelanceFlow Pro - June 2026</p>
        <p>Invoices, payout methods, and transaction history are managed here.</p>
      </div>
    </section>
  );
}
