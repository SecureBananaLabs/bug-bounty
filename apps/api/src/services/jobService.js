const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(ownerId, payload) {
  const job = { 
    id: `job_${Date.now()}`, 
    ownerId,
    title: payload.title,
    description: payload.description,
    budgetMin: payload.budgetMin,
    budgetMax: payload.budgetMax,
    categoryId: payload.categoryId,
    skills: payload.skills,
    status: "open",
    createdAt: new Date().toISOString()
  };
  jobs.push(job);
  return job;
}
