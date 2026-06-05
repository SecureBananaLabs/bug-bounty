const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, status: "open", ...payload };
  jobs.push(job);
  return job;
}

export async function getJobById(id) {
  return jobs.find((job) => job.id === id) || null;
}

export async function updateJob(id, payload) {
  const index = jobs.findIndex((job) => job.id === id);
  if (index === -1) return null;

  jobs[index] = { ...jobs[index], ...payload };
  return jobs[index];
}

export async function deleteJob(id) {
  const index = jobs.findIndex((job) => job.id === id);
  if (index === -1) return false;

  jobs.splice(index, 1);
  return true;
}
