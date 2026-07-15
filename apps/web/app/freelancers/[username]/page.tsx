import { freelancers } from "@/lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const profile = freelancers.find((f) => f.username === params.username);

  if (!profile) {
    return (
      <section className="card">
        <h2>Freelancer Not Found</h2>
        <p>No freelancer matches the username <strong>{params.username}</strong>.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>{profile.username}</h2>
      <p>Skills: <strong>{profile.skills.join(", ")}</strong></p>
      <p>Rate: <strong>{profile.rate}</strong></p>
    </section>
  );
}
