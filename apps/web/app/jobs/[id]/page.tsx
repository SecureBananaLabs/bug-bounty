import { jobs } from "../../../lib/mock";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = jobs.find((entry) => entry.id === id);

  if (!job) {
    return (
      <section className="card">
        <h2>Job not found</h2>
        <p>No active job matches <strong>{id}</strong>.</p>
        <p>Return to the job listings to choose an available project.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <p style={{ marginTop: 0, color: "#9fb0d8" }}>{job.category}</p>
      <h2>{job.title}</h2>
      <p>{job.description}</p>
      <p><strong>Budget:</strong> {job.budget}</p>

      <h3>Required skills</h3>
      <ul>
        {job.skills.map((skill) => (
          <li key={skill}>{skill}</li>
        ))}
      </ul>

      <h3>Milestones</h3>
      <ol>
        {job.milestones.map((milestone) => (
          <li key={milestone}>{milestone}</li>
        ))}
      </ol>
    </section>
  );
}
