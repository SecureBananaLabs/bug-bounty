const jobs = [];

export async function listJobs(filters = {}) {
  let filtered = [...jobs];

  if (filters.status) {
    filtered = filtered.filter((job) => job.status === filters.status);
  }

  if (filters.categoryId) {
    filtered = filtered.filter((job) => String(job.categoryId) === String(filters.categoryId));
  }

  if (filters.minBudget !== undefined && filters.minBudget !== null && filters.minBudget !== '') {
    const min = Number(filters.minBudget);
    if (!isNaN(min)) {
      filtered = filtered.filter((job) => {
        const budget = job.budgetMin !== undefined ? job.budgetMin : job.budget;
        return typeof budget === 'number' && budget >= min;
      });
    }
  }

  return filtered;
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, status: "open", ...payload };
  jobs.push(job);
  return job;
}
