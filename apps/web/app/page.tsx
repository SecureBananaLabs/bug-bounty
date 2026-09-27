import Link from "next/link";

export default function LandingPage() {
  const stats = [
    { label: "Open projects", value: "128", detail: "Across product, data, and growth" },
    { label: "Vetted freelancers", value: "2.4k", detail: "Ready for short and long engagements" },
    { label: "Median reply", value: "16m", detail: "For active marketplace threads" }
  ];

  const paths = [
    {
      href: "/jobs",
      title: "Browse active work",
      copy: "Review curated jobs with budget, skill, and delivery context."
    },
    {
      href: "/freelancers/search",
      title: "Find specialists",
      copy: "Compare freelancer profiles by role, skills, rating, and availability."
    },
    {
      href: "/jobs/post",
      title: "Draft a job",
      copy: "Shape a clear project brief before inviting matched talent."
    }
  ];

  const activity = [
    "API migration brief matched with 8 backend engineers",
    "Brand refresh shortlist updated with 5 design portfolios",
    "QA automation proposal moved into client review"
  ];

  return (
    <section className="landing">
      <div className="landing-hero">
        <div>
          <p className="landing-eyebrow">FreelanceFlow marketplace</p>
          <h2>Hire focused talent for real project momentum.</h2>
          <p>
            Move from brief to shortlist with clear project paths, trusted freelancer signals,
            and live marketplace activity in one place.
          </p>
          <div className="landing-actions">
            <Link href="/jobs">Explore jobs</Link>
            <Link href="/freelancers/search">Search freelancers</Link>
          </div>
        </div>
        <aside className="landing-snapshot">
          <strong>Today</strong>
          <span>24 proposals reviewed</span>
          <span>9 milestones approved</span>
          <span>6 contracts ready to start</span>
        </aside>
      </div>

      <div className="landing-stats">
        {stats.map((stat) => (
          <article className="card landing-stat" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.detail}</small>
          </article>
        ))}
      </div>

      <div className="landing-paths">
        {paths.map((path) => (
          <Link className="card landing-path" href={path.href} key={path.href}>
            <span>{path.title}</span>
            <p>{path.copy}</p>
          </Link>
        ))}
      </div>

      <section className="card landing-activity">
        <h3>Marketplace activity</h3>
        <div>
          {activity.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </section>
    </section>
  );
}
