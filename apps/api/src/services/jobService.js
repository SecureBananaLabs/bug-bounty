const jobs = [];

export async function listJobs() {
  return [...jobs];
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, status: "open", ...payload };
  jobs.push(job);
  return { ...job };
}

export async function getJob(id) {
  const job = jobs.find((j) => j.id === id);
  return job ? { ...job } : null;
}

export async function updateJob(id, updates) {
  const index = jobs.findIndex((j) => j.id === id);
  if (index === -1) {
    return null;
  }
  const updated = { ...jobs[index], ...updates };
  jobs[index] = updated;
  return { ...updated };
}
