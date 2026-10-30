const jobs = [];

export async function listJobs() {
  // Callers sort or trim the result, so hand them a snapshot rather than the
  // array this service keeps appending to.
  return [...jobs];
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, status: "open", ...payload };
  jobs.push(job);
  return job;
}
