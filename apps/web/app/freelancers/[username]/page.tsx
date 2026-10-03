<content>
import { Suspense } from 'react';

export default function FreelancerPage({ params }: { params: Promise<{ username: string }> }) {
  // Await the params promise to resolve the dynamic route parameter
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FreelancerProfile params={params} />
    </Suspense>
  );
}

async function FreelancerProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return (
    <div>
      <h1>Profile: {username}</h1>
    </div>
  );
}