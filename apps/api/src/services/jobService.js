import crypto from "node:crypto";

const jobs = [];

export async function listJobs() {
  return [...jobs];
}

export async function createJob(payload) {
  const safePayload =
    payload !== null && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const job = {
    ...safePayload,
    id: `job_${crypto.randomUUID()}`,
    status: "open"
  };
  jobs.push(job);
  return { ...job };
}

export async function updateJobStatus(id, status) {
  if (typeof id !== "string" || id.trim().length === 0) {
    return null;
  }
  const job = jobs.find((item) => item.id === id);
  if (!job) {
    return null;
  }
  job.status = status;
  return { ...job };
}
