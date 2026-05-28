import { createId } from "../utils/id.js";

const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const job = { id: createId("job"), status: "open", ...payload };
  jobs.push(job);
  return job;
}
