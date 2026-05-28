import crypto from "crypto";
const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const job = { id: `${m.group(1)}_${crypto.randomUUID()}`, status: "open", ...payload };
  jobs.push(job);
  return job;
}
