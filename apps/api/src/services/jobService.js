import { randomUUID } from "node:crypto";

const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const job = { id: `job_${randomUUID()}`, status: "open", ...payload };
  jobs.push(job);
  return job;
}
