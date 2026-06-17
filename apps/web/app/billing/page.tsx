"use client";
import { useState } from "react";

const MOCK_INVOICES = [
  { id: "inv-001", description: "Website redesign",     amount: "$1,500", date: "2026-06-01", status: "paid" },
  { id: "inv-002", description: "API integration work", amount: "$800",   date: "2026-06-10", status: "paid" },
  { id: "inv-003", description: "Mobile app audit",     amount: "$2,200", date: "2026-06-15", status: "pending" },
];

export default function BillingPage() {
  const [payoutMethod, setPayoutMethod] = useState("bank");

  return (
    <main style={{ padding: "1.5rem", maxWidth: 900, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>Billing</h1>

      {/* Balance summary */}
      <section className="card" aria-label="Balance summary" style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        <div><div style={{ fontSize: "1.8rem", fontWeight: "bold" }}>$2,300</div><div>Available balance</div></div>
        <div><div style={{ fontSize: "1.8rem", fontWeight: "bold" }}>$2,200</div><div>In escrow</div></div>
        <div><div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#e85" }}>$800</div><div>Pending payout</div></div>
      </section>

      {/* Payout method */}
      <section className="card" aria-label="Payout method" style={{ marginTop: "1.5rem" }}>
        <h2>Payout Method</h2>
        <label htmlFor="payout-select">Method: </label>
        <select id="payout-select" value={payoutMethod} onChange={e => setPayoutMethod(e.target.value)}>
          <option value="bank">Bank Transfer</option>
          <option value="paypal">PayPal</option>
          <option value="crypto">Crypto (USDC)</option>
        </select>
        <p style={{ marginTop: "0.5rem", color: "#666" }}>
          {payoutMethod === "bank"   && "Payouts arrive in 2–3 business days."}
          {payoutMethod === "paypal" && "Instant payouts to your PayPal account."}
          {payoutMethod === "crypto" && "USDC on Base network. Arrives within minutes."}
        </p>
        <button style={{ marginTop: "0.5rem", cursor: "pointer" }}>Request Payout</button>
      </section>

      {/* Invoice history */}
      <section className="card" aria-label="Invoice history" style={{ marginTop: "1.5rem" }}>
        <h2>Invoice History</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }} role="table" aria-label="Invoices">
          <thead>
            <tr>{["ID","Description","Amount","Date","Status"].map(h =>
              <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "0.4rem" }}>{h}</th>
            )}</tr>
          </thead>
          <tbody>
            {MOCK_INVOICES.map(inv => (
              <tr key={inv.id}>
                <td style={{ padding: "0.4rem", color: "#666" }}>{inv.id}</td>
                <td style={{ padding: "0.4rem" }}>{inv.description}</td>
                <td style={{ padding: "0.4rem", fontWeight: "bold" }}>{inv.amount}</td>
                <td style={{ padding: "0.4rem" }}>{inv.date}</td>
                <td style={{ padding: "0.4rem" }}>
                  <span style={{ color: inv.status === "paid" ? "green" : "#e85", fontWeight: "bold" }}>
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card" style={{ marginTop: "1.5rem" }}>
        <h2>Next Payout</h2>
        <p>Estimated: <strong>June 20, 2026</strong> — <strong>$800.00</strong> via {payoutMethod}</p>
      </section>
    </main>
  );
}
