import { getFreelancerByUsername } from "../../../lib/mock";
import { notFound } from "next/navigation";

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const freelancer = getFreelancerByUsername(params.username);

  if (!freelancer) {
    notFound();
  }

  return (
    <section className="card p-6 max-w-2xl mx-auto mt-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-bold">{freelancer.name}</h2>
          <p className="text-gray-500">@{freelancer.username}</p>
        </div>
        <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
          {freelancer.rate}
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">About</h3>
        <p className="text-gray-700 leading-relaxed">{freelancer.bio}</p>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-3">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {freelancer.skills.map(skill => (
            <span key={skill} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
