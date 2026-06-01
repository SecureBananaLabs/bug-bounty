export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const job = await fetchJob(params.id);

  if (!job) {
    return (
      <section className="card">
        <h2>Job Not Found</h2>
        <p>No job found with ID: <strong>{params.id}</strong></p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{job.title}</h2>
      <p>Description: {job.description}</p>
      <p>Budget: ${job.budgetMin} - ${job.budgetMax}</p>
      <p>Category: {job.category}</p>
    </section>
  );
}

async function fetchJob(id: string) {
  try {
    const res = await fetch(`${process.env.API_URL}/jobs/${id}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
