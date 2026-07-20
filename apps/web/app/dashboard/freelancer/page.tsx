export default function FreelancerDashboardPage() {
  const summaryCards = [
    {
      title: "Proposals",
      value: "12 total",
      detail: "4 pending review · 3 shortlisted"
    },
    {
      title: "Accepted Jobs",
      value: "5 active",
      detail: "2 starting this week"
    },
    {
      title: "Earnings",
      value: "$8,450",
      detail: "$2,100 awaiting release"
    },
    {
      title: "Response Metrics",
      value: "94% response rate",
      detail: "Avg reply time: 3h 20m"
    }
  ];

  return (
    <>
      <section className="card">
        <h2>Dashboard (Freelancer)</h2>
        <p>Snapshot of proposals, accepted jobs, earnings, and response metrics.</p>
      </section>
      <section className="grid" aria-label="Freelancer summary cards">
        {summaryCards.map((card) => (
          <article className="card" key={card.title}>
            <h3>{card.title}</h3>
            <p>{card.value}</p>
            <p>{card.detail}</p>
          </article>
        ))}
      </section>
    </>
  );
}
