import Link from "next/link";
import { freelancerProfiles } from "../../../lib/mock";

type PageProps = {
  params: Promise<{
    username: string;
  }>;
};

export default async function FreelancerProfilePage({ params }: PageProps) {
  const { username } = await params;
  const profile = freelancerProfiles.find((freelancer) => freelancer.username === username);

  if (!profile) {
    return (
      <section className="card profile-empty-state">
        <p className="eyebrow">Profile unavailable</p>
        <h2>No freelancer found</h2>
        <p className="muted">
          No profile exists for <strong className="profile-missing-username">{username}</strong>. Search current
          freelancers or check that the profile link is correct.
        </p>
        <Link className="button-link" href="/freelancers/search">
          Back to search
        </Link>
      </section>
    );
  }

  return (
    <section className="profile-page">
      <div className="profile-hero card">
        <div>
          <p className="eyebrow">{profile.username}</p>
          <h2>{profile.name}</h2>
          <p className="profile-role">{profile.role}</p>
          <p className="muted">{profile.summary}</p>
        </div>
        <aside className="profile-aside">
          <p>{profile.rate}</p>
          <span>{profile.availability}</span>
          <span>{profile.responseTime}</span>
          <Link className="button-link" href="/messaging">
            Message freelancer
          </Link>
        </aside>
      </div>

      <div className="profile-metrics">
        {profile.metrics.map((metric) => (
          <article className="card metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </div>

      <div className="profile-grid">
        <section className="card">
          <h3>Skills</h3>
          <div className="chip-list">
            {profile.skills.map((skill) => (
              <span className="chip" key={skill}>
                {skill}
              </span>
            ))}
          </div>
          <dl className="profile-facts">
            <div>
              <dt>Location</dt>
              <dd>{profile.location}</dd>
            </div>
            <div>
              <dt>Availability</dt>
              <dd>{profile.availability}</dd>
            </div>
          </dl>
        </section>

        <section className="card">
          <h3>Active proposals</h3>
          <div className="stacked-list">
            {profile.activeProposals.map((proposal) => (
              <article key={proposal.title}>
                <h4>{proposal.title}</h4>
                <p>{proposal.status}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="card">
        <h3>Portfolio</h3>
        <div className="profile-grid">
          {profile.portfolio.map((project) => (
            <article className="portfolio-item" key={project.title}>
              <h4>{project.title}</h4>
              <p>{project.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Client reviews</h3>
        <div className="profile-grid">
          {profile.reviews.map((review) => (
            <figure className="review-quote" key={review.author}>
              <blockquote>{review.quote}</blockquote>
              <figcaption>{review.author}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </section>
  );
}
