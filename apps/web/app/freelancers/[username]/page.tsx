export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  return (
    <section className="card">
      <h2>Freelancer Profile</h2>
      <p>Profile: <strong>{params.username}</strong></p>
      <p>Portfolio, reviews, and active proposals appear here.</p>
    </section>
  );
import { freelancers } from '../../../lib/mock';

// Return the freelancer data for the given username or null if not found
function getFreelancerByUsername(username: string) {
  return freelancers.find(freelancer => freelancer.username === username) || null;
}

export default function FreelancerProfile({ params }: { params: { username: string } }) {
  const { username } = params;
  const freelancer = getFreelancerByUsername(username);

  if (!freelancer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl">Freelancer not found</h1>
        <p>The requested freelancer profile could not be found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">@{freelancer.username}</h1>
              <div className="mt-4">
                <h2 className="text-xl font-semibold text-gray-800">Skills</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {freelancer.skills.map((skill, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <h2 className="text-xl font-semibold text-gray-800">Hourly Rate</h2>
                <p className="text-lg text-gray-600">{freelancer.rate}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">About</h2>
          <p className="text-gray-600">
            Professional freelancer with expertise in {freelancer.skills.join(', ')}. 
            I deliver high-quality work at a rate of {freelancer.rate}.
          </p>
        </div>
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Portfolio</h2>
          <p className="text-gray-600">Showcase of recent projects will appear here.</p>
        </div>
      </div>
    </div>
  );
}
}
