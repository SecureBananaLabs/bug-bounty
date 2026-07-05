const jobs = [];
let jobCounter = 0;

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  jobCounter += 1;
  const job = { id: `job_${Date.now()}_${jobCounter}`, status: "open", ...payload };
  jobs.push(job);
  return job;
}
