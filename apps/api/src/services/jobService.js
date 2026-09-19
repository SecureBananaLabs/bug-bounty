import { snapshotRecord, snapshotRecords } from "../utils/snapshot.js";

const jobs = [];

export async function listJobs() {
  return snapshotRecords(jobs);
}

export async function createJob(payload) {
  const job = snapshotRecord({ id: `job_${Date.now()}`, status: "open", ...payload });
  jobs.push(job);
  return snapshotRecord(job);
}
