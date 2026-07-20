import { freelancers, jobs } from "../../../lib/mock";

export default function ClientDashboardPage() {
  const totalBudget = jobs.reduce((sum, job) => {
    const amount = Number(job.budget.replace(/[^0-9]/g, ""));
    return sum + (Number.isNaN(amount) ? 0 : amount);
  }, 0);

  const totalFreelancerRate = freelancers.reduce((sum, freelancer) => {
    const amount = Number(freelancer.rate.replace(/[^0-9]/g, ""));
    return sum + (Number.isNaN(amount) ? 0 : amount);
  }, 0);

  const averageFreelancerRate = freelancers.length
    ? Math.round(totalFreelancerRate / freelancers.length)
    : 0;

  const summaryCards = [
    { label: "Open jobs", value: jobs.length.toString() },
    { label: "Total listed budget", value: `$${totalBudget.toLocaleString()}` },
    { label: "Available freelancers", value: freelancers.length.toString() },
    { label: "Average hourly rate", value: `$${averageFreelancerRate}/hr` }
  ];

  return (
    <section className="card">
      <h2>Dashboard (Client)</h2>
      <p>Track jobs, shortlisted freelancers, and payment milestones.</p>
      <div className="grid">
        {summaryCards.map((card) => (
          <article className="card" key={card.label}>
            <p style={{ margin: 0, opacity: 0.8 }}>{card.label}</p>
            <h3 style={{ margin: "0.5rem 0 0" }}>{card.value}</h3>
          </article>
        ))}
      </div>
    </section>
  );
}
