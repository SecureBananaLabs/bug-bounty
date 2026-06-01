const jobs = [];

export async function listJobs() {
  return jobs;
}

export async function createJob(payload) {
  // Validate budget ranges are not inverted
  const budgetMin = Number(payload.budgetMin);
  const budgetMax = Number(payload.budgetMax);

  if (Number.isFinite(budgetMin) && Number.isFinite(budgetMax) && budgetMin > budgetMax) {
    throw Object.assign(
      new Error("budgetMin cannot exceed budgetMax — ranges are inverted"),
      { statusCode: 400 }
    );
  }

  const job = {
    id: `job_${Date.now()}`,
    status: "open",
    ...payload,
    budgetMin: Number.isFinite(budgetMin) ? budgetMin : payload.budgetMin,
    budgetMax: Number.isFinite(budgetMax) ? budgetMax : payload.budgetMax,
  };
  jobs.push(job);
  return job;
}
