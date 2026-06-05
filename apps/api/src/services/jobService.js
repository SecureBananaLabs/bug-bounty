import { createServiceId } from "../utils/ids.js";

const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const job = { ...payload, id: createServiceId("job"), status: "open" };
  jobs.push(job);
  return job;
}
