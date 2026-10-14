const mockBalance = {
  available: 4823.5,
  escrowPending: 1250.0,
  nextPayout: "2026-06-12",
};

const mockInvoices = [
  { id: "INV-0042", client: "Acme Corp", amount: 3200, status: "Paid", date: "2026-05-28" },
  { id: "INV-0041", client: "NovaTech", amount: 1850, status: "Pending", date: "2026-06-01" },
  { id: "INV-0040", client: "PixelCraft", amount: 975, status: "Paid", date: "2026-05-15" },
  { id: "INV-0039", client: "Acme Corp", amount: 2100, status: "Overdue", date: "2026-04-20" },
];

const mockPayoutMethod = {
  type: "PayPal",
  email: "j***@gmail.com",
  last4: null,
};

const mockTransfers = [
  { id: "TX-9812", amount: 3200, date: "2026-05-30", status: "Completed" },
  { id: "TX-9805", amount: 975, date: "2026-05-18", status: "Completed" },
  { id: "TX-9798", amount: 4100, date: "2026-05-05", status: "Completed" },
];

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    Paid: "#22c55e",
    Completed: "#22c55e",
    Pending: "#eab308",
    Overdue: "#ef4444",
  };
  const bg = colorMap[status] || "#6b7280";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        background: `${bg}22`,
        color: bg,
      }}
    >
      {status}
    </span>
  );
}

export default function BillingPage() {
  return (
    <>
      <h2>Billing</h2>

      <div className="grid">
        <section className="card">
          <h3>Available Balance</h3>
          <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            ${mockBalance.available.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </section>

        <section className="card">
          <h3>Escrow Pending</h3>
          <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            ${mockBalance.escrowPending.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </section>

        <section className="card">
          <h3>Next Payout</h3>
          <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            {mockBalance.nextPayout}
          </p>
        </section>
      </div>

      <section className="card" style={{ marginTop: "1rem" }}>
        <h3>Recent Invoices</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #2a3765", textAlign: "left" }}>
              <th style={{ padding: "0.5rem" }}>Invoice</th>
              <th style={{ padding: "0.5rem" }}>Client</th>
              <th style={{ padding: "0.5rem" }}>Amount</th>
              <th style={{ padding: "0.5rem" }}>Date</th>
              <th style={{ padding: "0.5rem" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {mockInvoices.map((inv) => (
              <tr key={inv.id} style={{ borderBottom: "1px solid #2a376533" }}>
                <td style={{ padding: "0.5rem" }}>{inv.id}</td>
                <td style={{ padding: "0.5rem" }}>{inv.client}</td>
                <td style={{ padding: "0.5rem" }}>${inv.amount.toLocaleString()}</td>
                <td style={{ padding: "0.5rem" }}>{inv.date}</td>
                <td style={{ padding: "0.5rem" }}>
                  <StatusBadge status={inv.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid" style={{ marginTop: "1rem" }}>
        <section className="card">
          <h3>Payout Method</h3>
          <p>
            {mockPayoutMethod.type}: {mockPayoutMethod.email}
          </p>
        </section>

        <section className="card">
          <h3>Recent Transfers</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {mockTransfers.map((tx) => (
              <li
                key={tx.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.35rem 0",
                  borderBottom: "1px solid #2a376533",
                  fontSize: "0.875rem",
                }}
              >
                <span>
                  {tx.id} — {tx.date}
                </span>
                <span style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  ${tx.amount.toLocaleString()}
                  <StatusBadge status={tx.status} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
