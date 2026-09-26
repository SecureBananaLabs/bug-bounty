import { createEntityId } from "../utils/ids.js";

const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const job = { id: createEntityId("job"), status: "open", ...payload };
  jobs.push(job);
  return job;
}
