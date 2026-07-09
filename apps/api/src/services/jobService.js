const jobs = [];

export async function listJobs() {
  return jobs.map(j => ({ ...j }));
}

export async function createJob(payload) {
  const { title, description, budgetMin, budgetMax, categoryId, skills } = payload;
  const job = { id: `job_${Date.now()}`, status: "open", title, description, budgetMin, budgetMax, categoryId, skills };
  jobs.push(job);
  return { ...job };
}
