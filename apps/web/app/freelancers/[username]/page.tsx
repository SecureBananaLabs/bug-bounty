import { freelancers } from "@/lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const profile = freelancers.find((f) => f.username === params.username);

  if (!profile) {
    return (
      <section className="card">
        <h2>Freelancer not found</h2>
        <p>No freelancer found with username <strong>{params.username}</strong>.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Freelancer Profile</h2>
      <p>Username: <strong>{profile.username}</strong></p>
      <p>Skills: {profile.skills.join(", ")}</p>
      <p>Rate: {profile.rate}</p>
    </section>
  );
}
