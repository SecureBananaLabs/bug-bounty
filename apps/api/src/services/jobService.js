const jobs = [];

export async function listJobs() {
  return jobs.map((j) => ({ ...j }));
}

export async function createJob(payload) {
  const { id: _id, status: _status, ...safePayload } = payload;
  const job = { id: `job_${Date.now()}`, status: "open", ...safePayload };
  jobs.push(job);
  return { ...job };
}
