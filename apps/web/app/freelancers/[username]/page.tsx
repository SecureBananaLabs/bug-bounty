const MOCK_PROFILES: Record<string, { name: string; title: string; rating: number; skills: string[] }> = {
  "alice-chen": { name: "Alice Chen", title: "Full-Stack Developer", rating: 4.9, skills: ["React", "Node.js", "PostgreSQL"] },
  "bob-martinez": { name: "Bob Martinez", title: "Mobile Developer", rating: 4.7, skills: ["React Native", "Swift", "Kotlin"] }
};

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const profile = MOCK_PROFILES[params.username];
  if (!profile) {
    return (
      <section className="card">
        <h2>Profile Not Found</h2>
        <p>No freelancer found with username: <strong>{params.username}</strong></p>
      </section>
    );
  }
  return (
    <section className="card">
      <h2>{profile.name}</h2>
      <p><strong>{profile.title}</strong></p>
      <p>Rating: {profile.rating}/5</p>
      <p>Skills: {profile.skills.join(", ")}</p>
    </section>
  );
}
