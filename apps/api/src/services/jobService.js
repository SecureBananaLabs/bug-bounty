const jobs = [];

export async function listJobs(filters = {}) {
  let result = [...jobs];
  if (filters.status && typeof filters.status === "string") {
    result = result.filter((j) => j.status === filters.status.toLowerCase().trim());
  }
  if (filters.categoryId && typeof filters.categoryId === "string") {
    result = result.filter((j) => j.categoryId === filters.categoryId.trim());
  }
  if (filters.minBudget !== undefined && !isNaN(Number(filters.minBudget))) {
    const min = Number(filters.minBudget);
    result = result.filter((j) => (j.budgetMax ?? j.budgetMin ?? 0) >= min);
  }
  return result;
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, status: "open", ...payload };
  jobs.push(job);
  return job;
}
