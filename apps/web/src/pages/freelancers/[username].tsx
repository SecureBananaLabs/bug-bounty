import { useRouter } from 'next/router';
import { freelancers } from '../../lib/mock';
import Link from 'next/link';

export default function FreelancerProfile() {
  const router = useRouter();
  const { username } = router.query;

  if (!username || typeof username !== 'string') {
    return <div>Loading...</div>;
  }

  const freelancer = freelancers.find(
    (f) => f.username === username
  );

  if (!freelancer) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Freelancer Not Found</h1>
        <p>No freelancer with the username &quot;{username}&quot; exists.</p>
        <Link href="/search">
          <a>Back to search</a>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>{freelancer.name}</h1>
      <p><strong>Username:</strong> {freelancer.username}</p>
      <p><strong>Role:</strong> {freelancer.role}</p>
      <p><strong>Hourly Rate:</strong> ${freelancer.hourlyRate}/hr</p>
      <p><strong>Bio:</strong> {freelancer.bio}</p>
      <div>
        <strong>Skills:</strong>
        <ul>
          {freelancer.skills.map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>
      </div>
      <Link href="/search">
        <a>Back to search</a>
      </Link>
    </div>
  );
}
