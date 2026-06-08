const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const { status: _, ...rest } = payload;
  const job = { id: `job_${Date.now()}`, status: "OPEN", ...rest };
  jobs.push(job);
  return job;
}
