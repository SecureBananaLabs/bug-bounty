import { jobs } from "../../../lib/mock";

const mockProposals = [
  { id: "prp-1", jobTitle: "Build an AI customer support widget", bidAmount: "$1,400", status: "Pending" },
  { id: "prp-2", jobTitle: "Migrate legacy API to Node.js", bidAmount: "$2,600", status: "Accepted" }
];

const mockEarnings = { thisMonth: "$2,600", total: "$14,200" };

export default function FreelancerDashboardPage() {
  return (
    <section className="card">
      <h2>Dashboard (Freelancer)</h2>
      <h3>Earnings</h3>
      <p>This month: <strong>{mockEarnings.thisMonth}</strong> · All time: <strong>{mockEarnings.total}</strong></p>
      <h3>My Proposals</h3>
      <ul>
        {mockProposals.map(p => (
          <li key={p.id}>{p.jobTitle} — {p.bidAmount} — <em>{p.status}</em></li>
        ))}
      </ul>
    </section>
  );
}
