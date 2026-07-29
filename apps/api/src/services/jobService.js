const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(validatedData) {
  const job = {
    id: `job_${Date.now()}`,
    status: "open",
    title: validatedData.title,
    description: validatedData.description,
    budgetMin: validatedData.budgetMin,
    budgetMax: validatedData.budgetMax,
    categoryId: validatedData.categoryId,
    skills: validatedData.skills
  };
  jobs.push(job);
  return job;
}
