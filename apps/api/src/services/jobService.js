const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, ...payload, status: "OPEN" };
  jobs.push(job);
  return job;
}
