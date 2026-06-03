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

  // Sanitize data to prevent XSS
  const sanitizedName = freelancer.name || "Unknown";
  const sanitizedUsername = freelancer.username || params.username;
  const skills = Array.isArray(freelancer.skills) ? freelancer.skills : [];
  const rating = typeof freelancer.rating === "number" ? freelancer.rating : 0;

  return (
    <section className="card">
      <h2>{sanitizedName}</h2>
      <p>Username: <strong>{sanitizedUsername}</strong></p>
      <p>Skills: {skills.length > 0 ? skills.join(", ") : "None listed"}</p>
      <p>Rating: {rating}/5</p>
    </section>
  );
}

async function fetchFreelancer(username: string) {
  try {
    const res = await fetch(`${process.env.API_URL}/freelancers/${username}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds (ISR)
    });
    
    if (!res.ok) {
      // Distinguish 404 from other errors
      if (res.status === 404) {
        return null;
      }
      // For other errors, log and return null
      console.error(`Failed to fetch freelancer ${username}: ${res.status}`);
      return null;
    }
    
    return res.json();
  } catch (error) {
    // Network error
    console.error(`Network error fetching freelancer ${username}:`, error);
    return null;
  }
}
