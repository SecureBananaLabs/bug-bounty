const MOCK_JOBS: Record<string, { title: string; description: string; budget: string; skills: string[] }> = {
  job_001: { title: "Build React Dashboard", description: "We need a responsive admin dashboard built with React and Tailwind.", budget: "$500–$800", skills: ["React", "TypeScript", "Tailwind"] },
  job_002: { title: "API Integration", description: "Integrate third-party REST APIs into our Node.js backend.", budget: "$300–$500", skills: ["Node.js", "REST", "Express"] }
};

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = MOCK_JOBS[params.id];
  if (!job) {
    return (
      <section className="card">
        <h2>Job Not Found</h2>
        <p>No job found with id: <strong>{params.id}</strong></p>
      </section>
    );
  }
  return (
    <section className="card">
      <h2>{job.title}</h2>
      <p>{job.description}</p>
      <p><strong>Budget:</strong> {job.budget}</p>
      <p><strong>Skills:</strong> {job.skills.join(", ")}</p>
    </section>
  );
}
