const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, status: "open", ...payload, createdAt: new Date().toISOString() };
  jobs.push(job);
  return job;
}
