import crypto from "node:crypto";

const jobs = [];

export async function listJobs() {
  return [...jobs];
}

export async function createJob(payload = {}) {
  const { id: _ignoredId, ...rest } = payload ?? {};
  const job = {
    status: "open",
    ...rest,
    id: `job_${crypto.randomUUID()}`
  };
  jobs.push(job);
  return job;
}
