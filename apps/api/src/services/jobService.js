const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, status: "open", ...payload };
  jobs.push(job);
  return job;
}

export async function updateJobStatus(id, status) {
  const job = jobs.find((item) => item.id === id);

  if (!job) {
    return null;
  }

  job.status = status;
  job.updatedAt = new Date().toISOString();

  return job;
}
