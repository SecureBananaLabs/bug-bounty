export const jobs = [];

export async function listJobs() {
  return [...jobs];
}

export async function createJob(job) {
  jobs.push(job);
  return job;
}
