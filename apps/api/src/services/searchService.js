import { listUsers } from "./userService.js";
import { listJobs } from "./jobService.js";

export async function globalSearch(query) {
  const q = (query || "").toLowerCase().trim();
  if (!q) {
    return { query, users: [], jobs: [], freelancers: [] };
  }

  const users = await listUsers();
  const jobs = await listJobs();

  const matchedUsers = users.filter(
    (u) =>
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q)) ||
      (u.id && u.id.toLowerCase().includes(q))
  );

  const matchedJobs = jobs.filter(
    (j) =>
      (j.title && j.title.toLowerCase().includes(q)) ||
      (j.description && j.description.toLowerCase().includes(q)) ||
      (j.skills && j.skills.some((s) => s.toLowerCase().includes(q))) ||
      (j.categoryId && j.categoryId.toLowerCase().includes(q))
  );

  const freelancers = users.filter(
    (u) => u.role === "freelancer" && matchedUsers.includes(u)
  );

  return {
    query,
    users: matchedUsers,
    jobs: matchedJobs,
    freelancers
  };
}
