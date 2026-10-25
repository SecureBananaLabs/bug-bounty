import { freelancers } from "../../../lib/mock";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((entry) => entry.username === params.username);

  return (
    <section className="card">
      <h2>Freelancer Profile</h2>
      {freelancer ? (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <p>{freelancer.username}</p>
          <p>{freelancer.skills.join(", ")}</p>
          <p>{freelancer.rate}</p>
        </div>
      ) : (
        <p>Freelancer not found</p>
      )}
    </section>
  );
}
