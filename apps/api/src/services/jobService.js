const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  // eslint-disable-next-line no-unused-vars
  const { id: _id, status: _status, ...safe } = payload;
  const job = { id: `job_${Date.now()}`, status: "open", ...safe };
  jobs.push(job);
  return job;
}
