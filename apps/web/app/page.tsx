import Link from "next/link";

export default function LandingPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <section className="card" style={{ textAlign: "center", padding: "2rem" }}>
        <h2 style={{ fontSize: "2rem" }}>Welcome to FreelanceFlow</h2>
        <p>Hire top freelancers for engineering, design, writing, and growth projects.</p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1rem" }}>
          <Link href="/jobs" className="card" style={{ padding: "0.6rem 1.2rem", background: "#5468ff", color: "white" }}>Browse Jobs</Link>
          <Link href="/freelancers/search" className="card" style={{ padding: "0.6rem 1.2rem" }}>Find Freelancers</Link>
          <Link href="/jobs/post" className="card" style={{ padding: "0.6rem 1.2rem" }}>Post a Job</Link>
        </div>
      </section>

      <section className="card">
        <h3>🔥 Featured Jobs</h3>
        <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
          <li><Link href="/jobs/job-101">Build an AI customer support widget</Link> — $1,500</li>
          <li><Link href="/jobs/job-102">Migrate legacy API to Node.js</Link> — $2,800</li>
          <li><Link href="/jobs/job-103">Design SaaS onboarding flows</Link> — $900</li>
        </ul>
      </section>

      <section className="card">
        <h3>⭐ Top Freelancers</h3>
        <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
          <li><Link href="/freelancers/maya-dev">maya-dev</Link> — Next.js, TypeScript · $65/hr</li>
          <li><Link href="/freelancers/jordan-ux">jordan-ux</Link> — Figma, UX Research · $52/hr</li>
        </ul>
      </section>
    </div>
  );
}
