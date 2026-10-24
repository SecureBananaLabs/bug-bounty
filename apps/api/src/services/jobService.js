const jobs = [];

export async function listJobs(filters = {}) {
  const { status, categoryId, minBudget } = filters ?? {};
  const minimum = Number(minBudget);
  const wantedStatus = typeof status === "string" && status.length > 0 ? status : undefined;
  const wantedCategory =
    typeof categoryId === "string" && categoryId.length > 0 ? categoryId : undefined;
  const hasMinimum = minBudget !== undefined && minBudget !== "" && Number.isFinite(minimum);

  return jobs.filter((job) => {
    if (wantedStatus !== undefined && job.status !== wantedStatus) {
      return false;
    }

    if (wantedCategory !== undefined && job.categoryId !== wantedCategory) {
      return false;
    }

    const ceiling = Number(job.budgetMax ?? job.budgetMin);

    if (hasMinimum && ceiling < minimum) {
      return false;
    }

    return true;
  });
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, status: "open", ...payload };
  jobs.push(job);
  return job;
}
