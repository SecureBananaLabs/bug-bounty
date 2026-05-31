export default function ClientDashboardPage() {
  const summaries = [
    { label: "Active jobs", value: "3", detail: "2 proposals need review" },
    { label: "Shortlisted freelancers", value: "5", detail: "3 available this week" },
    { label: "Payment milestones", value: "$4.2k", detail: "1 milestone awaiting approval" }
  ];

  return (
    <section>
      <h2>Dashboard (Client)</h2>
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
          <li>Review proposals for the AI customer support widget.</li>
          <li>Confirm the onboarding flow design milestone.</li>
          <li>Invite shortlisted freelancers to the API migration job.</li>
        </ul>
      </section>
    </section>
  );
}
