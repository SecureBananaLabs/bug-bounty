import { listUsers } from "../services/userService.js";
import { listJobs } from "../services/jobService.js";

export async function getAdminMetrics() {
  const users = listUsers();
  const jobs = listJobs();

  const openJobs = jobs.filter((j) => j.status === "open").length;
  const activeFreelancers = users.filter((u) => u.role === "freelancer").length;
  const activeClients = users.filter((u) => u.role === "client").length;
  const flaggedAccounts = users.filter((u) => u.status === "flagged" || u.status === "suspended").length;
  const totalUsers = users.length;
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j) => j.status === "completed").length;
  const disputedJobs = jobs.filter((j) => j.status === "disputed").length;
  const monthlyVolume = 128900; // Placeholder until Stripe integration is live

  return {
    totalUsers,
    openJobs,
    totalJobs,
    completedJobs,
    disputedJobs,
    activeFreelancers,
    activeClients,
    flaggedAccounts,
    monthlyVolume
  };
}
