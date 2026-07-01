import Link from "next/link";
import { freelancers } from "../../../lib/mock";
import styles from "./page.module.css";

export default function FreelancerSearchPage() {
  const talent = freelancers.map((freelancer, index) => {
    const details = [
      {
        availability: "Available this week",
        rating: "4.9",
        response: "12m",
        focus: "Frontend systems",
        summary: "Builds polished Next.js interfaces, design systems, and analytics-ready product surfaces."
      },
      {
        availability: "Booking next sprint",
        rating: "4.8",
        response: "25m",
        focus: "Product discovery",
        summary: "Turns research findings into clear flows, prototypes, and client-ready design handoff."
      }
    ][index];

    return { ...freelancer, ...details };
  });

  return (
    <section className={styles.search}>
      <div className={`card ${styles.header}`}>
        <div>
          <p className={styles.eyebrow}>Talent search</p>
          <h2>Freelancer Search</h2>
          <p>Compare available specialists by skill, rate, responsiveness, and project focus.</p>
        </div>
        <div className={styles.scorecard}>
          <span>Recommended match pool</span>
          <strong>{talent.length}</strong>
          <small>Profiles ready for outreach</small>
        </div>
      </div>

      <div className={styles.metrics}>
        <article className="card">
          <span>Avg rating</span>
          <strong>4.85</strong>
          <small>From visible talent</small>
        </article>
        <article className="card">
          <span>Fastest reply</span>
          <strong>12m</strong>
          <small>Current response signal</small>
        </article>
        <article className="card">
          <span>Skill coverage</span>
          <strong>4</strong>
          <small>Core marketplace skills</small>
        </article>
      </div>

      <div className={`card ${styles.filters}`}>
        <div>
          <span>Skills</span>
          <button type="button">All</button>
          <button type="button">Next.js</button>
          <button type="button">UX Research</button>
        </div>
        <div>
          <span>Availability</span>
          <button type="button">This week</button>
          <button type="button">Next sprint</button>
        </div>
      </div>

      <div className={styles.results}>
        {talent.map((freelancer) => (
          <article className={`card ${styles.card}`} key={freelancer.username}>
            <div className={styles.cardHeader}>
              <div>
                <span>{freelancer.focus}</span>
                <h3>{freelancer.username}</h3>
              </div>
              <strong>{freelancer.rate}</strong>
            </div>

            <p>{freelancer.summary}</p>

            <div className={styles.skills}>
              {freelancer.skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>

            <div className={styles.facts}>
              <div>
                <span>Rating</span>
                <strong>{freelancer.rating}</strong>
              </div>
              <div>
                <span>Reply</span>
                <strong>{freelancer.response}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{freelancer.availability}</strong>
              </div>
            </div>

            <Link href={`/freelancers/${freelancer.username}`}>Open profile</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
