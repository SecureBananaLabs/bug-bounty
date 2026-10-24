const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const job = {
    ...payload,
    id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    status: "open",
  };
  jobs.push(job);
  return job;
}
