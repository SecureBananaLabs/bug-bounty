import { jobs } from "../../../lib/mock";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = jobs.find(j => j.id === params.id);
  
  if (!job) {
    return (
      <section className="card">
        <h2>Job Not Found</h2>
        <p>The job <strong>{params.id}</strong> does not exist.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{job.title}</h2>
      <p className="budget"><strong>Budget:</strong> {job.budget}</p>
      <p className="description">Full job description would be rendered here with milestones, required skills, and client information.</p>
      <button className="btn btn-primary">Apply Now</button>
    </section>
  );
}
