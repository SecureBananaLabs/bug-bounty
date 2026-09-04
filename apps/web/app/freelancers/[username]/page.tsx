type FreelancerProfilePageProps = {
  params: Promise<{ username: string }>;
};

export default async function FreelancerProfilePage({ params }: FreelancerProfilePageProps) {
  const { username } = await params;

  return (
    <section className="card">
      <h2>Freelancer Profile</h2>
      <p>Profile: <strong>{username}</strong></p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
    </section>
  );
}
