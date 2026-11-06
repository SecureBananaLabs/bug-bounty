const jobs = [];

export const DEFAULT_JOB_LIMIT = 20;
export const MAX_JOB_LIMIT = 100;

function clampLimit(limit) {
  if (typeof limit !== "number" || !Number.isFinite(limit) || limit < 1) {
    return DEFAULT_JOB_LIMIT;
  }

  return Math.min(Math.trunc(limit), MAX_JOB_LIMIT);
}

function clampOffset(offset) {
  if (typeof offset !== "number" || !Number.isFinite(offset) || offset < 0) {
    return 0;
  }

  return Math.trunc(offset);
}

export async function listJobs(options) {
  if (options === undefined || options === null) {
    return [...jobs];
  }

  const limit = clampLimit(options.limit);
  const offset = clampOffset(options.offset);

  return {
    data: jobs.slice(offset, offset + limit),
    pagination: { limit, offset, total: jobs.length }
  };
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, status: "open", ...payload };
  jobs.push(job);
  return job;
}
