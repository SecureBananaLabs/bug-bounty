import { freelancers } from '../../../lib/mock';

export default function FreelancerProfile({ username }: { username: string }) {
  const freelancer = freelancers.find((freelancer) => freelancer.username === username);

  if (!freelancer) {
    return <div>Freelancer not found</div>;
  }

  return (
    <div>
      <h1>{freelancer.username}</h1>
      <p>Skills: {freelancer.skills.join(', ')}</p>
      <p>Hourly Rate: {freelancer.rate}</p>
    </div>
  );
}