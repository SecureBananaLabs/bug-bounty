const summary = [
  ["Available balance", "$4,280"],
  ["Pending payouts", "$1,150"],
  ["Open invoices", "3"]
];

const invoices = [
  ["INV-1042", "AI support widget", "Due Jun 3", "$1,500", "Open"],
  ["INV-1038", "Brand refresh", "Paid May 24", "$820", "Paid"],
  ["INV-1033", "Analytics pipeline", "Due May 31", "$2,100", "Review"]
];

const transactions = [
  ["May 28", "Milestone released", "+$1,500"],
  ["May 25", "Platform fee", "-$120"],
  ["May 24", "Payout to bank", "-$2,000"]
];

const panelStyle = {
  border: "1px solid #2a3765",
  borderRadius: 8,
  padding: "1rem"
};

const mutedStyle = { color: "#b7c2e7" };

export default function BillingPage() {
  return (
    <section className="card" style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h2>Billing</h2>
        <p style={{ ...mutedStyle, marginBottom: 0 }}>
          Review balances, invoices, payout methods, and recent account activity.
        </p>
      </header>

      <div className="grid">
        {summary.map(([label, value]) => (
          <div key={label} style={panelStyle}>
            <p style={{ ...mutedStyle, marginTop: 0 }}>{label}</p>
            <strong style={{ fontSize: "1.6rem" }}>{value}</strong>
          </div>
        ))}
      </div>

      <section style={panelStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Invoices</h3>
          <span style={mutedStyle}>Updated today</span>
        </div>
        <div style={{ display: "grid", gap: "0.7rem" }}>
          {invoices.map(([id, project, date, amount, status]) => (
            <div
              key={id}
              style={{
                borderTop: "1px solid #2a3765",
                display: "grid",
                gap: "0.4rem",
                gridTemplateColumns: "1fr auto",
                paddingTop: "0.7rem"
              }}
            >
              <div>
                <strong>{id}</strong>
                <p style={{ ...mutedStyle, margin: "0.2rem 0 0" }}>
                  {project} - {date}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <strong>{amount}</strong>
                <p style={{ ...mutedStyle, margin: "0.2rem 0 0" }}>{status}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid">
        <section style={panelStyle}>
          <h3 style={{ marginTop: 0 }}>Payout Method</h3>
          <p>Bank account ending in 4821</p>
          <p style={mutedStyle}>Verified - next payout scheduled for Jun 1</p>
        </section>

        <section style={panelStyle}>
          <h3 style={{ marginTop: 0 }}>Recent Transactions</h3>
          <div style={{ display: "grid", gap: "0.6rem" }}>
            {transactions.map(([date, label, amount]) => (
              <div
                key={`${date}-${label}`}
                style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}
              >
                <span style={mutedStyle}>{date}</span>
                <span>{label}</span>
                <strong>{amount}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
