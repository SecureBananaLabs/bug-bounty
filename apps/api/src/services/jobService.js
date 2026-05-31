const jobs = [];
const ALLOWED_FIELDS = ["title", "description", "budget", "category", "skills"];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const sanitized = {};
  for (const field of ALLOWED_FIELDS) {
    if (payload[field] !== undefined) {
      sanitized[field] = payload[field];
    }
  }
  const job = { id: `job_${Date.now()}`, status: "open", ...sanitized };
  jobs.push(job);
  return job;
}
