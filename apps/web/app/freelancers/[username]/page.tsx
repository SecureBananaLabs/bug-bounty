import { freelancers } from "../../../lib/mock";
export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const p = freelancers.find((f) => f.username === params.username);
  if (!p) return <section className="card"><h2>Not Found</h2><p>No profile for <strong>{params.username}</strong>.</p></section>;
  return <section className="card"><h2>{p.username}</h2><p><strong>Skills:</strong> {p.skills.join(", ")}</p><p><strong>Rate:</strong> {p.rate}</p></section>;
}
