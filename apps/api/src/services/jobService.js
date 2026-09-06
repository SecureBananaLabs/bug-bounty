import { randomUUID } from "crypto";

const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload = {}) {
  const { id: _ignoredId, ...safePayload } = payload;
  const job = {
    status: "open",
    ...safePayload,
    id: `job_${Date.now()}_${randomUUID().slice(0, 8)}`,
  };
  jobs.push(job);
  return job;
}
