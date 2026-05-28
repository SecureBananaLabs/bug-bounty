const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  const { title, description, budgetMin, budgetMax, categoryId, skills } = payload;
  const job = {
    title,
    description,
    budgetMin,
    budgetMax,
    categoryId,
    skills: skills ?? [],
    id: `job_${Date.now()}`,
    status: "open",
  };
  jobs.push(job);
  return job;
}
