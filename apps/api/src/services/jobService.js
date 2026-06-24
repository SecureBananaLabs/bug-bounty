const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const { status: _ignored, ...safePayload } = payload || {};
  const job = { id: `job_${Date.now()}`, status: "open", ...safePayload };
  jobs.push(job);
  return job;
}
