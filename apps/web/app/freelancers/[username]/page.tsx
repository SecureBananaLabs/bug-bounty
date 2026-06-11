import { freelancers } from "@/lib/mock";
import { notFound } from "next/navigation";

/**
 * Freelancer profile page.
 *
 * Looks up a freelancer by `username` from the mock data and
 * renders their profile details (skills and rate). If no matching
 * freelancer is found, a 404 page is displayed.
 */
export default function FreelancerProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const freelancer = freelancers.find((f) => f.username === params.username);

  if (!freelancer) {
    notFound();
  }

  return (
    <section className="card">
      <h2>Freelancer Profile</h2>
      <p>
        <strong>{freelancer.username}</strong>
      </p>
      <p>Rate: {freelancer.rate}</p>
      <div>
        <h3>Skills</h3>
        <ul>
          {freelancer.skills.map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
