const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, status: "open", createdAt: new Date().toISOString(), ...payload };
  jobs.push(job);
  return job;
}
