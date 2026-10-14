import { snapshotRecord } from "./snapshot.js";

const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const job = snapshotRecord({ id: `job_${Date.now()}`, status: "open", ...payload });
  jobs.push(job);
  return snapshotRecord(job);
}
