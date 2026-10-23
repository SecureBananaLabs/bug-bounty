type Invoice = {
  id: string;
  client: string;
  amount: string;
  issued: string;
  due: string;
  status: "paid" | "pending" | "overdue";
};

type PayoutMethod = {
  id: string;
  kind: string;
  label: string;
  isDefault: boolean;
};

type Transaction = {
  id: string;
  description: string;
  amount: string;
  date: string;
  type: "credit" | "debit";
};

// 模拟数据 —— 不需要后端，纯前端展示
const invoices: Invoice[] = [
  { id: "INV-2026-001", client: "Acme Corp", amount: "$1,500.00", issued: "2026-06-01", due: "2026-06-15", status: "pending" },
  { id: "INV-2026-002", client: "Globex Inc", amount: "$2,800.00", issued: "2026-05-20", due: "2026-06-03", status: "overdue" },
  { id: "INV-2026-003", client: "Initech", amount: "$900.00", issued: "2026-05-15", due: "2026-05-29", status: "paid" },
];

const payoutMethods: PayoutMethod[] = [
  { id: "pm-1", kind: "bank", label: "Chase Business — ····4242", isDefault: true },
  { id: "pm-2", kind: "wallet", label: "USDC (Base) — 0x7B01…2ED8", isDefault: false },
];

const transactions: Transaction[] = [
  { id: "tx-001", description: "Invoice #INV-2026-003 paid", amount: "$900.00", date: "2026-06-05", type: "credit" },
  { id: "tx-002", description: "Payout to bank account", amount: "-$750.00", date: "2026-05-28", type: "debit" },
  { id: "tx-003", description: "Invoice #INV-2026-001 issued", amount: "$1,500.00", date: "2026-06-01", type: "credit" },
  { id: "tx-004", description: "Platform fee (5%)", amount: "-$75.00", date: "2026-05-28", type: "debit" },
];

function statusColor(status: Invoice["status"]): string {
  if (status === "paid") return "#34d399";
  if (status === "overdue") return "#f87171";
  return "#fbbf24";
}

export default function BillingPage() {
  const pendingTotal = invoices
    .filter((inv) => inv.status !== "paid")
    .reduce((sum, inv) => sum + parseFloat(inv.amount.replace(/[$,]/g, "")), 0)
    .toLocaleString("en-US", { minimumFractionDigits: 2 });

  return (
    <div>
      {/* ===== 发票概览 ===== */}
      <section className="card">
        <h2>Invoices &amp; Payments</h2>
        <p style={{ color: "#8892b0", marginBottom: "0.75rem" }}>
          Outstanding balance: <strong style={{ color: "#fbbf24" }}>${pendingTotal}</strong>
        </p>
        <div className="grid">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="card"
              style={{ borderColor: statusColor(inv.status) + "44" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>{inv.id}</strong>
                <span
                  style={{
                    background: statusColor(inv.status) + "22",
                    color: statusColor(inv.status),
                    padding: "0.15rem 0.5rem",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {inv.status}
                </span>
              </div>
              <p style={{ margin: "0.25rem 0", color: "#8892b0" }}>{inv.client}</p>
              <p style={{ margin: 0, fontWeight: 700 }}>{inv.amount}</p>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#667" }}>
                Due {inv.due}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 收款方式 ===== */}
      <section className="card">
        <h2>Payout Methods</h2>
        <div className="grid">
          {payoutMethods.map((pm) => (
            <div key={pm.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ textTransform: "capitalize" }}>{pm.kind}</strong>
                {pm.isDefault && (
                  <span
                    style={{
                      background: "#34d39922",
                      color: "#34d399",
                      padding: "0.1rem 0.4rem",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                    }}
                  >
                    Default
                  </span>
                )}
              </div>
              <p style={{ margin: "0.25rem 0 0", color: "#8892b0", fontSize: "0.9rem" }}>
                {pm.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 交易记录 ===== */}
      <section className="card">
        <h2>Transaction History</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid #2a3765",
                  textAlign: "left",
                  color: "#8892b0",
                  fontSize: "0.85rem",
                }}
              >
                <th style={{ padding: "0.5rem" }}>Date</th>
                <th style={{ padding: "0.5rem" }}>Description</th>
                <th style={{ padding: "0.5rem", textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  style={{ borderBottom: "1px solid #1e2746", fontSize: "0.9rem" }}
                >
                  <td style={{ padding: "0.5rem", color: "#8892b0" }}>{tx.date}</td>
                  <td style={{ padding: "0.5rem" }}>{tx.description}</td>
                  <td
                    style={{
                      padding: "0.5rem",
                      textAlign: "right",
                      color: tx.type === "credit" ? "#34d399" : "#f87171",
                      fontWeight: 600,
                    }}
                  >
                    {tx.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
