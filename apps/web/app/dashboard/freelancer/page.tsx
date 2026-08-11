export default function FreelancerDashboardPage() {
  const summaries = [
    { label: "Open proposals", value: "4", detail: "2 awaiting client feedback" },
    { label: "Accepted jobs", value: "2", detail: "1 milestone due this week" },
    { label: "Earnings", value: "$3.1k", detail: "$900 pending approval" },
    { label: "Response rate", value: "94%", detail: "Median reply time under 2 hours" }
  ];

  return (
    <section>
      <h2>Dashboard (Freelancer)</h2>
      <div className="grid">
        {summaries.map((summary) => (
          <article className="card" key={summary.label}>
            <h3>{summary.label}</h3>
            <p>{summary.value}</p>
            <p>{summary.detail}</p>
          </article>
        ))}
      </div>
      <section className="card">
        <h3>Next actions</h3>
        <ul>
          <li>Send a follow-up on the API migration proposal.</li>
          <li>Submit milestone notes for the onboarding flow project.</li>
          <li>Update availability before the next client review window.</li>
        </ul>
      </section>
    </section>
  );
}
