export default function JobDetailPage({ params }: { params: { id: string } }) {
  return (
    <section className="card">
      <h2>Job Detail</h2>
      <p>Viewing details for <strong>{params.id}</strong>.</p>
      <p>Responsibilities, milestones, and proposals would be shown here.</p>
    </section>
  );
}
