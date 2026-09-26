export default function BillingPage() {
  const invoices = [
    { id: "INV-1042", client: "Northstar Labs", amount: "$2,400", status: "Due in 5 days" },
    { id: "INV-1038", client: "Atlas Studio", amount: "$875", status: "Paid" },
    { id: "INV-1031", client: "Beacon AI", amount: "$1,250", status: "Escrow funded" }
  ];

  const paymentMethods = [
    { label: "Primary payout", value: "USDC wallet ending 9f42" },
    { label: "Backup method", value: "Bank transfer ending 4182" },
    { label: "Tax profile", value: "W-8BEN verified" }
  ];

  return (
    <section>
      <h2>Billing</h2>

      <div className="grid">
        <article className="card">
          <h3>Available balance</h3>
          <p style={{ fontSize: 28, margin: "0.5rem 0" }}>$4,525</p>
          <p>Ready for payout after active escrow reviews clear.</p>
        </article>

        <article className="card">
          <h3>Escrow pending</h3>
          <p style={{ fontSize: 28, margin: "0.5rem 0" }}>$1,250</p>
          <p>One milestone is funded and waiting for client approval.</p>
        </article>

        <article className="card">
          <h3>Next payout</h3>
          <p style={{ fontSize: 28, margin: "0.5rem 0" }}>Jun 14</p>
          <p>Automatic weekly payout is enabled for the primary method.</p>
        </article>
      </div>

      <section className="card">
        <h3>Invoices</h3>
        <div style={{ display: "grid", gap: 12 }}>
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              style={{
                border: "1px solid #2a3765",
                borderRadius: 8,
                display: "grid",
                gap: 8,
                gridTemplateColumns: "1fr auto",
                padding: "0.8rem"
              }}
            >
              <div>
                <strong>{invoice.id}</strong>
                <p style={{ margin: "0.25rem 0 0" }}>{invoice.client}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <strong>{invoice.amount}</strong>
                <p style={{ margin: "0.25rem 0 0" }}>{invoice.status}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Payout setup</h3>
        <div className="grid">
          {paymentMethods.map((method) => (
            <div key={method.label}>
              <strong>{method.label}</strong>
              <p>{method.value}</p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
