const jobs = [];

export async function listJobs() {
  return jobs.map(job => structuredClone(job));
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, status: "open", ...payload };
  jobs.push(structuredClone(job));
  return structuredClone(job);
}

