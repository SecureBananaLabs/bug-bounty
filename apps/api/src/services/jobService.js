const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const { id, status, ...rest } = payload;
  const job = { ...rest, id: `job_${Date.now()}`, status: "open" };
  jobs.push(job);
  return job;
}
