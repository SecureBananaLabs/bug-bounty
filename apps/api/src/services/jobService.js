const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const { id: _ignoredId, status: _ignoredStatus, ...safePayload } = payload;
  const job = { ...safePayload, id: `job_${Date.now()}`, status: "open" };
  jobs.push(job);
  return job;
}
