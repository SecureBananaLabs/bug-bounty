const jobs = [];
export async function listJobs() { return jobs; }
export async function createJob(payload) {
  const { id: _id, status: _s, ...safe } = payload;
  const job = { id: `job_${Date.now()}`, status: "open", ...safe };
  jobs.push(job);
  return job;
}
