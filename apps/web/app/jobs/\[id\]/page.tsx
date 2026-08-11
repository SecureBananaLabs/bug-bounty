import { jobs } from "../../../lib/mock";
import Link from "next/link";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find((j) => j.id === params.id);

  if (!job) {
    return (
      <section className="card" style={{ maxWidth: "600px", margin: "2rem auto", padding: "2rem" }}>
        <h2 style={{ color: "#d9534f" }}>Job Not Found</h2>
        <p>The job listing with ID <strong>{params.id}</strong> could not be found or does not exist.</p>
        <div style={{ marginTop: "1.5rem" }}>
          <Link href="/jobs" style={{ color: "#3182ce", textDecoration: "underline" }}>
            &larr; Back to job listings
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="card" style={{ maxWidth: "600px", margin: "2rem auto", padding: "2rem" }}>
      <h2>{job.title}</h2>
      <div style={{ margin: "1rem 0", display: "flex", gap: "1.5rem", alignItems: "center" }}>
        <span style={{ background: "#ebf8ff", color: "#2b6cb0", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontWeight: "bold" }}>
          Budget: {job.budget}
        </span>
        <span style={{ color: "#718096" }}>ID: {job.id}</span>
      </div>
      <p style={{ lineHeight: "1.6", color: "#4a5568", marginTop: "1rem" }}>
        We are seeking a talented professional to assist us with the listed requirements.
        Milestones, detailed specifications, and proposal submission workflows are managed directly below.
      </p>
      
      <div style={{ borderTop: "1px solid #e2e8f0", marginTop: "2rem", paddingTop: "1.5rem" }}>
        <h3>Proposals & Milestones</h3>
        <p style={{ color: "#718096", fontSize: "0.9rem" }}>
          Submit a proposal to apply for this job. Ensure you detail your approach, estimated duration, and terms.
        </p>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <Link href="/jobs" style={{ color: "#3182ce", textDecoration: "underline" }}>
          &larr; Back to job listings
        </Link>
      </div>
    </section>
  );
}
