const sanitizeHtml = (s) => String(s||"").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, status: "open", ...payload };
  jobs.push(job);
  return job;
}
