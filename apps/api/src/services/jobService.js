const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const job = { ...payload, id: `job_${Date.now()}`, status: "open" };
  jobs.push(job);
  return job;
}
