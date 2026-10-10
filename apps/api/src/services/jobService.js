import { createPublicId } from "../utils/publicId.js";

const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const job = { id: createPublicId("job"), status: "open", ...payload };
  jobs.push(job);
  return job;
}
