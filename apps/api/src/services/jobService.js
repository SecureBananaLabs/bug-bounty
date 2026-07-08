const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const { id: _ignoredId, status: _ignoredStatus, ...rest } = payload;
  const job = { id: `job_${Date.now()}`, status: "open", ...rest };
  jobs.push(job);
  return job;
}
