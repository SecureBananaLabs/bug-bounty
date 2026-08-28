import Link from "next/link";
import { freelancers } from "../../../lib/mock";

export default function FreelancerSearchPage() {
  return (
    <section>
      <h2>Freelancer Search</h2>
      <div className="grid">
        {freelancers.map((freelancer) => (
          <article className="card" key={freelancer.username}>
            <h3>{freelancer.username}</h3>
            <p>{freelancer.skills.join(" · ")}</p>
            <p>{freelancer.rate}</p>
            <Link href={`/freelancers/${freelancer.username}`}>Open profile</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
