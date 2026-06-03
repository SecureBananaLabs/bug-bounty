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

  // Sanitize data to prevent XSS
  const title = job.title || "Untitled Job";
  const description = job.description || "No description provided";
  const category = job.category || "Uncategorized";
  const budgetMin = job.budgetMin != null ? `$${job.budgetMin}` : "N/A";
  const budgetMax = job.budgetMax != null ? `$${job.budgetMax}` : "N/A";

  return (
    <section className="card">
      <h2>{title}</h2>
      <p>Description: {description}</p>
      <p>Budget: {budgetMin} - {budgetMax}</p>
      <p>Category: {category}</p>
    </section>
  );
}

async function fetchJob(id: string) {
  try {
    const res = await fetch(`${process.env.API_URL}/jobs/${id}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds (ISR)
    });
    
    if (!res.ok) {
      // Distinguish 404 from other errors
      if (res.status === 404) {
        return null;
      }
      // For other errors, log and return null
      console.error(`Failed to fetch job ${id}: ${res.status}`);
      return null;
    }
    
    return res.json();
  } catch (error) {
    // Network error
    console.error(`Network error fetching job ${id}:`, error);
    return null;
  }
}
