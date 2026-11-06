const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const { id, status, ...jobFields } = payload ?? {};
  const job = { ...jobFields, id: `job_${Date.now()}`, status: "open" };
  jobs.push(job);
  return job;
}
