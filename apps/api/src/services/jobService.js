import { copyRecords } from "../utils/recordCopy.js";

const jobs = [];

export async function listJobs() {
  return copyRecords(jobs);
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, status: "open", ...payload };
  jobs.push(job);
  return job;
}
