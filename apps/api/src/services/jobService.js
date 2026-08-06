import { cloneRecord, cloneRecords } from "../utils/records.js";

const jobs = [];

export async function listJobs() {
  return cloneRecords(jobs);
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, status: "open", ...payload };
  jobs.push(job);
  return cloneRecord(job);
}
