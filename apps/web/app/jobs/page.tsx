import Link from "next/link";
import { jobs } from "../../lib/mock";

export default function JobsPage() {
  const jobDetails = jobs.map((job, index) => {
    const details = [
      {
        category: "AI automation",
        timeline: "2 week sprint",
        proposals: 12,
        status: "Hiring now",
        description: "Ship a support widget with triage flows, analytics events, and handoff states."
      },
      {
        category: "Backend",
        timeline: "4 week migration",
        proposals: 8,
        status: "Shortlisting",
        description: "Move a legacy API to Node.js with clean route ownership and regression coverage."
      },
      {
        category: "Product design",
        timeline: "10 day project",
        proposals: 15,
        status: "New",
        description: "Design onboarding flows with prototype states, empty states, and handoff notes."
      }
    ][index];

    return { ...job, ...details };
  });

  const totalBudget = jobDetails.reduce(
    (sum, job) => sum + Number(job.budget.replace(/[$,]/g, "")),
    0
  );

  return (
    <section className="jobs-board">
      <div className="jobs-header card">
        <div>
          <p className="jobs-eyebrow">Marketplace jobs</p>
          <h2>Job Listings</h2>
          <p>Compare active briefs by budget, category, timeline, and proposal activity.</p>
        </div>
        <div className="jobs-total">
          <span>Total open budget</span>
          <strong>${totalBudget.toLocaleString()}</strong>
        </div>
      </div>

      <div className="jobs-summary">
        <article className="card job-metric">
          <span>Open roles</span>
          <strong>{jobDetails.length}</strong>
          <small>Ready for proposals</small>
        </article>
        <article className="card job-metric">
          <span>Avg budget</span>
          <strong>${Math.round(totalBudget / jobDetails.length).toLocaleString()}</strong>
          <small>Across visible listings</small>
        </article>
        <article className="card job-metric">
          <span>Active proposals</span>
          <strong>{jobDetails.reduce((sum, job) => sum + job.proposals, 0)}</strong>
          <small>Under client review</small>
        </article>
      </div>

      <div className="jobs-toolbar card">
        <div>
          <span>Filters</span>
          <button type="button">All</button>
          <button type="button">Engineering</button>
          <button type="button">Design</button>
        </div>
        <div>
          <span>Sort</span>
          <button type="button">Budget</button>
          <button type="button">Newest</button>
        </div>
      </div>

      <div className="jobs-list">
        {jobDetails.map((job) => (
          <article className="card job-card" key={job.id}>
            <div>
              <div className="job-card-topline">
                <span>{job.category}</span>
                <span>{job.status}</span>
              </div>
              <h3>{job.title}</h3>
              <p>{job.description}</p>
            </div>

            <div className="job-card-meta">
              <div>
                <span>Budget</span>
                <strong>{job.budget}</strong>
              </div>
              <div>
                <span>Timeline</span>
                <strong>{job.timeline}</strong>
              </div>
              <div>
                <span>Proposals</span>
                <strong>{job.proposals}</strong>
              </div>
            </div>

            <Link href={`/jobs/${job.id}`}>View details</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
