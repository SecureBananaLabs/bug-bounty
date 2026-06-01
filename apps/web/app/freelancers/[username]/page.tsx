export default async function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = await fetchFreelancer(params.username);

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer Not Found</h2>
        <p>No freelancer found with username: <strong>{params.username}</strong></p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{freelancer.name}</h2>
      <p>Username: <strong>{freelancer.username}</strong></p>
      <p>Skills: {freelancer.skills?.join(", ")}</p>
      <p>Rating: {freelancer.rating}/5</p>
    </section>
  );
}

async function fetchFreelancer(username: string) {
  try {
    const res = await fetch(`${process.env.API_URL}/freelancers/${username}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
