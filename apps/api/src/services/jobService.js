const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  // Fix #5202: Prevent caller from overriding server-generated id and status
  const { id: _ignored, status: _ignoredStatus, ...safePayload } = payload;
  const job = { id: `job_${Date.now()}`, status: "open", ...safePayload };
  jobs.push(job);
  return job;
}
