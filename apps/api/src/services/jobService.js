const jobs = [];

export async function listJobs() {
  return jobs.map((job) => ({ ...job }));
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, status: "open", ...payload };
  jobs.push(job);
  return job;
}
