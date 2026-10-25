const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function getJobById(id) {
  return jobs.find((job) => job.id === id) ?? null;
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, status: "open", ...payload };
  jobs.push(job);
  return job;
}
