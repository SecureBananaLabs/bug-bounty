const jobs = [];
let jobCounter = 0;

/**
 * Generate a unique job ID, safe for same-millisecond calls.
 * @returns {string} Unique job ID
 */
function generateJobId() {
  jobCounter++;
  return `job_${Date.now()}_${jobCounter}`;
}

export async function listJobs() {
  return jobs;
}

export async function createJob(payload = {}) {
  // Spread payload first, then server-controlled fields override
  const job = {
    ...payload,
    id: generateJobId(),
    status: "open",
  };
  jobs.push(job);
  return job;
}
