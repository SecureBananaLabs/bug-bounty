import { freelancers } from '../../../lib/mock';

interface Props {
  params: { username: string };
}

export default function FreelancerProfilePage({ params }: Props) {
  const { username } = params;
  const freelancer = freelancers.find((f) => f.username === username);

  if (!freelancer) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Freelancer Not Found</h1>
        <p>
          The freelancer with username &quot;{username}&quot; does not exist.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>{freelancer.name}</h1>
      <p><strong>Username:</strong> {freelancer.username}</p>
      <p><strong>Hourly Rate:</strong> ${freelancer.hourlyRate}</p>
      <h3>Skills</h3>
      <ul>
        {freelancer.skills.map((skill: string) => (
          <li key={skill}>{skill}</li>
        ))}
      </ul>
    </div>
  );
}
