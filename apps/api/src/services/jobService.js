const jobs = [];

const VALID_STATUSES = new Set(["DRAFT", "OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, status: "DRAFT", ...payload };
  jobs.push(job);
  return job;
}

export async function updateJobStatus(id, status) {
  if (!VALID_STATUSES.has(status)) {
    throw new Error(`Invalid job status: ${status}`);
  }
  const job = jobs.find((j) => j.id === id);
  if (!job) {
    throw new Error(`Job not found: ${id}`);
  }
  job.status = status;
  return job;
}
