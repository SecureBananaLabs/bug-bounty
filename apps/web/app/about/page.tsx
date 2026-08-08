import Link from "next/link";

const features = [
  "Verified freelancer profiles and searchable skills",
  "Structured job posting, proposals, reviews, and payments",
  "Client and freelancer dashboards for day-to-day project work",
  "Messaging, notifications, billing, and admin workflows"
];

const stack = [
  "Next.js App Router frontend",
  "Express API with controllers, services, routes, and Zod validation",
  "Prisma schema for users, jobs, proposals, payments, and messages",
  "Shared workspace packages for database and UI foundations"
];

export default function AboutPage() {
  return (
    <>
      <section className="card">
        <h2>About FreelanceFlow</h2>
        <p>
          FreelanceFlow is a full-stack freelance marketplace for teams that need to hire,
          manage, and pay specialists across engineering, design, writing, and growth work.
        </p>
        <p>
          The platform combines job discovery, proposal workflows, messaging, payments, and
          operational dashboards so clients and freelancers can keep project work in one place.
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <h3>Platform Features</h3>
          <ul>
            {features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h3>Technology Stack</h3>
          <ul>
            {stack.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="card">
        <h3>Built For Marketplace Operations</h3>
        <p>
          FreelanceFlow is organized as a monorepo with separate web, API, database, and shared
          UI workspaces, making it easier to evolve product features without losing clear module
          boundaries.
        </p>
        <Link href="/">Back to home</Link>
      </section>
    </>
  );
}
