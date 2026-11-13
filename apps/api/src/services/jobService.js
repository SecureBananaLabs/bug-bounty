import { createPrefixedId } from "../utils/id.js";

const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const job = { ...payload, id: createPrefixedId("job"), status: "open" };
  jobs.push(job);
  return job;
}
