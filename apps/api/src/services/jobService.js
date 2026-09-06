const jobs = [];

export async function listJobs() {
  // Return a shallow copy — callers cannot mutate the in-memory store.
  return [...jobs];
}

export async function createJob(payload) {
  // Server-controlled fields must come AFTER the spread so clients cannot
  // override them:
  //
  // - id: previously before the spread, allowing a caller to supply their
  //   own job ID and alias or collide with an existing record.
  //
  // - status: previously before the spread, allowing a caller to supply
  //   status:"closed" or status:"awarded" at creation time, bypassing
  //   the intended job lifecycle (open -> awarded -> completed).
  //   Jobs must always start as "open".
  const job = {
    ...payload,
    id: `job_${Date.now()}`,
    status: "open"
  };
  jobs.push(job);
  return job;
}
