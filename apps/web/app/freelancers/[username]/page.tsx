import { notFound } from "next/navigation";
import { freelancers } from "../../../lib/mock";

interface Freelancer {
  username: string;
  skills: string[];
  rate: string;
}

export default function FreelancerProfile({ params }: { params: { username: string } }) {
  const freelancer = freelancers.find((f: Freelancer) => f.username === params.username);

  if (!freelancer) {
    notFound();
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Freelancer Profile: {freelancer.username}</h1>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Skills</h2>
        <ul className="list-disc pl-5 mt-2">
          {freelancer.skills.map((skill, index) => (
            <li key={index}>{skill}</li>
          ))}
        </ul>
        <p className="mt-4">Hourly Rate: {freelancer.rate}</p>
      </div>
    </div>
  );
}
