const MOCK_PROPOSALS = [
  { id: "prp_001", job: "Build React Dashboard", status: "pending", bid: 650 },
  { id: "prp_002", job: "API Integration", status: "accepted", bid: 400 },
  { id: "prp_003", job: "Mobile App MVP", status: "rejected", bid: 1200 }
];

const MOCK_EARNINGS = [
  { month: "May 2025", amount: 2400 },
  { month: "April 2025", amount: 1875 },
  { month: "March 2025", amount: 3100 }
];

export default function FreelancerDashboardPage() {
  return (
    <section className="card">
      <h2>Dashboard (Freelancer)</h2>

      <h3>Proposals</h3>
      <ul>
        {MOCK_PROPOSALS.map(p => (
          <li key={p.id}>
            <strong>{p.job}</strong> — Bid: ${p.bid} — {p.status}
          </li>
        ))}
      </ul>

      <h3>Earnings</h3>
      <ul>
        {MOCK_EARNINGS.map(e => (
          <li key={e.month}>{e.month}: ${e.amount}</li>
        ))}
      </ul>
    </section>
  );
}
