import { listUsers } from "../services/userService.js";
import { listJobs } from "../services/jobService.js";

export async function globalSearch(query) {
  if (!query || query.trim().length === 0) {
    return { query: "", users: [], jobs: [], freelancers: [] };
  }

  const q = query.trim().toLowerCase();
  const users = listUsers();
  const jobs = listJobs();

  const matchedUsers = users.filter(
    (u) =>
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
  );

  const matchedJobs = jobs.filter(
    (j) =>
      (j.title && j.title.toLowerCase().includes(q)) ||
      (j.description && j.description.toLowerCase().includes(q)) ||
      (j.status && j.status.toLowerCase().includes(q))
  );

  return {
    query,
    users: matchedUsers,
    jobs: matchedJobs,
    freelancers: matchedUsers.filter((u) => u.role === "freelancer")
  };
}
