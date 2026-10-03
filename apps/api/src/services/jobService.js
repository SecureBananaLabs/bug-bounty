import { randomUUID } from "node:crypto";

const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const job = {
    status: "open",
    ...payload,
    id: `job_${Date.now()}_${randomUUID()}`,
  };
  jobs.push(job);
  return job;
}
