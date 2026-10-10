// Read-only jobs list – mutation must go through dedicated functions.
export const jobs = [];

/**
 * Returns an independent snapshot of the jobs array so callers cannot
 * mutate the service's backing storage via the returned reference.
 */
export async function listJobs() {
  return [...jobs];
}

export async function createJob(job) {
  jobs.push(job);
  return job;
}

export async function removeJob(jobId) {
  const index = jobs.findIndex((job) => job.id === jobId);
  if (index === -1) return false;
  jobs.splice(index, 1);
  return true;
}

export async function getJob(jobId) {
  return jobs.find((job) => job.id === jobId) ?? null;
}

export async function updateJob(jobId, updates) {
  const job = jobs.find((job) => job.id === jobId);
  if (!job) return null;
  Object.assign(job, updates);
  return job;
}
