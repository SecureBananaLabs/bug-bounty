const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  // IMPORTANT: server-controlled fields (id, status) must come AFTER the
  // payload spread so they cannot be overridden by client-supplied data.
  // Previously `status: "open"` appeared before `...payload`, allowing a
  // caller to set status="completed" or status="cancelled" at creation time.
  const job = { ...payload, id: `job_${Date.now()}`, status: "open" };
  jobs.push(job);
  return job;
}
