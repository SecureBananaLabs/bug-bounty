import crypto from "node:crypto";

const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const job = { id: `job_${crypto.randomUUID().slice(0, 8)}`, status: "open", ...payload };
  jobs.push(job);
  return job;
}
