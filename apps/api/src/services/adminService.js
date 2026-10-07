import { listJobs } from "./jobService.js";
import { listUsers } from "./userService.js";

export async function getAdminMetrics() {
  // TODO: replace the in-memory stores with Prisma aggregates.
  const [jobs, users] = await Promise.all([listJobs(), listUsers()]);
  const openJobs = jobs.filter((job) => job.status === "open");

  return {
    openJobs: openJobs.length,
    activeFreelancers: users.filter((user) => user.role === "freelancer").length,
    flaggedAccounts: users.filter((user) => user.flagged === true).length,
    monthlyVolume: openJobs.reduce(
      (total, job) => total + Number(job.budgetMax ?? job.budgetMin ?? 0),
      0
    )
  };
}
