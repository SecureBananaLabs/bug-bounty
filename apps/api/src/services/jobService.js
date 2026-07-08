const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const job = {
    id: `job_${Date.now()}`,
    title: payload.title,
    description: payload.description,
    budgetMin: payload.budgetMin,
    budgetMax: payload.budgetMax,
    categoryId: payload.categoryId,
    skills: payload.skills,
    status: "open"
  };
  jobs.push(job);
  return job;
}
