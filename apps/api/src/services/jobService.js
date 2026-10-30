import crypto from "node:crypto";

const jobs = [];

export async function listJobs() {
  return [...jobs];
}

export async function createJob(payload = {}) {
  const safePayload =
    payload !== null && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const { id: _ignoredId, ...rest } = safePayload;
  const job = {
    status: "open",
    ...rest,
    id: `job_${crypto.randomUUID()}`
  };
  jobs.push(job);
  return job;
}
