const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const job = {
    id: `job_${Date.now()}`,
    status: "open",
    flagged: false,
    moderationStatus: null,
    createdAt: new Date().toISOString(),
    ...payload,
  };
  jobs.push(job);
  return job;
}

export async function findJobById(id) {
  return jobs.find((j) => j.id === id) || null;
}

export async function updateJobStatus(id, status, extra = {}) {
  const job = jobs.find((j) => j.id === id);
  if (!job) return null;
  job.status = status;
  job.updatedAt = new Date().toISOString();
  Object.assign(job, extra);
  return job;
}

export async function updateJobModeration(id, moderationStatus, extra = {}) {
  const job = jobs.find((j) => j.id === id);
  if (!job) return null;
  job.moderationStatus = moderationStatus;
  job.updatedAt = new Date().toISOString();
  Object.assign(job, extra);
  return job;
}
