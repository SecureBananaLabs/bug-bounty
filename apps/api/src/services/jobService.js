const jobs = [];

export async function listJobs() {
  return [...jobs]; // Defensive copy
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, status: "open", ...payload };
  jobs.push(job);
  return job;
}
