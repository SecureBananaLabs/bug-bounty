export default async function FreelancerProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return (
    <section className="card">
      <h2>Freelancer Profile</h2>
      <p>Profile: <strong>{username}</strong></p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
    </section>
  );
}
