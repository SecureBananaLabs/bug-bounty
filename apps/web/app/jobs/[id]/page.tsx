<content>
import { Suspense } from 'react';

export default function JobPage({ params }: { params: Promise<{ id: string }> }) {
  // Await the params promise to resolve the dynamic route parameter
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JobDetails params={params} />
    </Suspense>
  );
}

async function JobDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <h1>Viewing details for {id}.</h1>
    </div>
  );
}