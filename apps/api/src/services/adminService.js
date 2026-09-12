import { listJobs } from "./jobService.js";
import { listUsers } from "./userService.js";

export async function getAdminMetrics() {
  const [jobs, users] = await Promise.all([listJobs(), listUsers()]);

  return {
    openJobs: jobs.filter((job) => job.status === "open").length,
    activeFreelancers: users.filter((user) => user.role === "freelancer").length,
    flaggedAccounts: 0,
    monthlyVolume: 0
  };
}
