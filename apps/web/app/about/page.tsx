export default function AboutPage() {
  return (
    <section className="card">
      <h2>About FreelanceFlow</h2>
      <p>
        FreelanceFlow is a full-stack freelance platform that connects businesses with
        top freelance talent across engineering, design, writing, and growth disciplines.
      </p>

      <h3>Key Features</h3>
      <ul>
        <li>Job listing and discovery with advanced search</li>
        <li>Freelancer profiles and portfolio management</li>
        <li>Secure messaging and real-time notifications</li>
        <li>Escrow payment system for trusted transactions</li>
        <li>Client and freelancer dashboards</li>
        <li>Review and reputation system</li>
        <li>Admin moderation and trust metrics</li>
      </ul>

      <h3>Technology Stack</h3>
      <ul>
        <li><strong>Frontend:</strong> Next.js (React), TypeScript</li>
        <li><strong>Backend:</strong> Node.js, Express</li>
        <li><strong>Database:</strong> PostgreSQL with Drizzle ORM</li>
        <li><strong>Payments:</strong> Stripe integration</li>
        <li><strong>Deployment:</strong> Docker, cloud-native</li>
      </ul>

      <p style={{ marginTop: "1rem" }}>
        <a href="/">Back to home</a>
      </p>
    </section>
  );
}
