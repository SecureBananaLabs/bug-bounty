import Link from "next/link";
import { jobs } from "../../../lib/mock";

const proposals = [
  { id: "prp-1", jobTitle: "Build an AI customer support widget", bid: 1200, status: "Pending", jobId: "job-101" },
  { id: "prp-2", jobTitle: "Design SaaS onboarding flows", bid: 800, status: "Accepted", jobId: "job-103" }
];

const earnings = {
  totalEarned: 4250,
  thisMonth: 800,
  pending: 1200
};

export default function FreelancerDashboardPage() {
  return (
    <section>
      <h2>Dashboard (Freelancer)</h2>

      <h3>Earnings Summary</h3>
      <div className="grid">
        <article className="card">
          <h4>Total Earned</h4>
          <p>${earnings.totalEarned.toLocaleString()}</p>
        </article>
        <article className="card">
          <h4>This Month</h4>
          <p>${earnings.thisMonth.toLocaleString()}</p>
        </article>
        <article className="card">
          <h4>Pending</h4>
          <p>${earnings.pending.toLocaleString()}</p>
        </article>
      </div>

      <h3>Active Proposals</h3>
      <div className="grid">
        {proposals.map((proposal) => (
          <article className="card" key={proposal.id}>
            <h4>{proposal.jobTitle}</h4>
            <p>Bid: ${proposal.bid.toLocaleString()}</p>
            <p><strong>{proposal.status}</strong></p>
            <Link href={`/jobs/${proposal.jobId}`}>View Job</Link>
          </article>
        ))}
      </div>

      <h3>Accepted Jobs</h3>
      <div className="grid">
        {jobs
          .filter((_, i) => i < 2)
          .map((job) => (
            <article className="card" key={job.id}>
              <h4>{job.title}</h4>
              <p>{job.budget}</p>
              <Link href={`/jobs/${job.id}`}>View</Link>
            </article>
          ))}
      </div>
    </section>
  );
}
