export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <section className="card">
      <h2>Job Detail</h2>
      <p>Viewing details for <strong>{id}</strong>.</p>
      <p>Responsibilities, milestones, and proposals would be shown here.</p>
    </section>
  );
}
