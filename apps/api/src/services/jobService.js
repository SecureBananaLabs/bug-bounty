const jobs = [];

export async function listJobs({ skip = 0, limit = 20 } = {}) {
  return { items: jobs.slice(skip, skip + limit), total: jobs.length };
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, status: "open", ...payload };
  jobs.push(job);
  return job;
}
