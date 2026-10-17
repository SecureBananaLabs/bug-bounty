import { jobs } from "./jobService.js";
import { users } from "./userService.js";
import { proposals } from "./proposalService.js";
import { reviews } from "./reviewService.js";
import { notifications } from "./notificationService.js";
import { messages } from "./messageService.js";

/**
 * Compute real admin metrics from in-memory stores.
 * Replace with SQL/Prisma aggregation queries in production.
 */
export async function getAdminMetrics() {
  const openJobs = jobs.filter((j) => j.status === "open").length;
  const activeFreelancers = users.filter(
    (u) => u.role === "freelancer"
  ).length;
  const flaggedAccounts = users.filter(
    (u) => u.status === "flagged" || u.role === "admin"
  ).length;
  const monthlyVolume = proposals.reduce(
    (sum, p) => sum + (p.budget || p.amount || 0), 0
  );

  return {
    totalUsers: users.length,
    totalJobs: jobs.length,
    openJobs,
    activeFreelancers,
    flaggedAccounts,
    totalProposals: proposals.length,
    totalReviews: reviews.length,
    monthlyVolume,
    // Derived stats
    avgProposalsPerJob: jobs.length > 0 ? Math.round(proposals.length / jobs.length * 10) / 10 : 0,
    unreadNotifications: notifications.filter((n) => !n.read).length,
    totalMessages: messages.length,
  };
}
