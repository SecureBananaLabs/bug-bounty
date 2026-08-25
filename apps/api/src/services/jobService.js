const jobs = [];

export async function listJobs() {
  // Return a shallow copy so callers cannot mutate the module-level store
  // by calling .push(), .splice(), or .sort() on the returned reference.
  return [...jobs];
}

export async function createJob(payload) {
  // Server-owned fields (id, status) must come AFTER the spread so they
  // cannot be overridden by client-supplied values.
  const job = { ...payload, id: `job_${Date.now()}`, status: "open" };
  jobs.push(job);
  return job;
}

