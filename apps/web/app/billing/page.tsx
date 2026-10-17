export default function BillingPage() {
  const invoices = [
    { id: "inv_001", date: "2026-05-01", amount: "$850.00", status: "Paid" },
    { id: "inv_002", date: "2026-05-15", amount: "$1,200.00", status: "Paid" },
    { id: "inv_003", date: "2026-06-01", amount: "$640.00", status: "Pending" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h2>Billing</h2>

      <section className="card">
        <h3>Payment Methods</h3>
        <p>Visa •••• 4242 <span style={{ color: "#22c55e", marginLeft: "0.5rem" }}>Default</span></p>
        <button>Add Payment Method</button>
      </section>

      <section className="card">
        <h3>Payout Account</h3>
        <p><strong>Status:</strong> <span style={{ color: "#f59e0b" }}>Not configured</span></p>
        <button>Set Up Payouts</button>
      </section>

      <section className="card">
        <h3>Invoices</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: "1px solid #ddd" }}>
            <th style={{ textAlign: "left", padding: "0.4rem" }}>Invoice</th>
            <th style={{ textAlign: "left", padding: "0.4rem" }}>Date</th>
            <th style={{ textAlign: "left", padding: "0.4rem" }}>Amount</th>
            <th style={{ textAlign: "left", padding: "0.4rem" }}>Status</th>
          </tr></thead>
          <tbody>{invoices.map((inv) => (
            <tr key={inv.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "0.4rem", fontFamily: "monospace", fontSize: "0.85rem" }}>{inv.id}</td>
              <td style={{ padding: "0.4rem" }}>{inv.date}</td>
              <td style={{ padding: "0.4rem" }}>{inv.amount}</td>
              <td style={{ padding: "0.4rem", color: inv.status === "Paid" ? "#22c55e" : "#f59e0b" }}>{inv.status}</td>
            </tr>
          ))}</tbody>
        </table>
      </section>
    </div>
  );
}
