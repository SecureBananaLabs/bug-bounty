const jobs = [];

export async function listJobs({ limit, offset } = {}) {
  // Backwards compatible: if no pagination is requested, return the full
  // array (matches pre-pagination behaviour for any in-process callers).
  if (limit === undefined && offset === undefined) {
    return jobs;
  }
  const offsetNum = Number(offset);
  const limitNum = Number(limit);
  const safeOffset = Number.isFinite(offsetNum) && offsetNum >= 0 ? offsetNum : 0;
  const safeLimit = Number.isFinite(limitNum) && limitNum > 0 ? limitNum : 20;
  const start = Math.min(safeOffset, jobs.length);
  const end = Math.min(start + safeLimit, jobs.length);
  return {
    data: jobs.slice(start, end),
    pagination: {
      limit: safeLimit,
      offset: safeOffset,
      total: jobs.length
    }
  };
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, status: "open", ...payload };
  jobs.push(job);
  return job;
}

export function _resetJobsForTesting() {
  jobs.length = 0;
}
