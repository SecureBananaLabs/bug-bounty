import { createResourceId } from "../utils/id.js";

const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const job = { ...payload, id: createResourceId("job"), status: "open" };
  jobs.push(job);
  return job;
}
