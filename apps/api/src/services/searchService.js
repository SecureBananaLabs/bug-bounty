import { listJobs } from "./jobService.js";
import { listUsers } from "./userService.js";

export async function globalSearch(query) {
  if (!query || !query.trim()) {
    return { query: "", users: [], jobs: [], freelancers: [] };
  }

  const terms = query.trim().toLowerCase().split(/\s+/);
  const jobs = await listJobs();
  const users = await listUsers();

  const match = (text) => {
    const lower = String(text).toLowerCase();
    return terms.every((t) => lower.includes(t));
  };

  const matchedJobs = jobs.filter(
    (j) => match(j.title) || match(j.description)
  );
  const matchedUsers = users.filter(
    (u) => match(u.email) || match(u.name || "")
  );

  return {
    query,
    users: matchedUsers,
    jobs: matchedJobs,
    freelancers: matchedUsers.filter((u) => u.role === "freelancer"),
  };
}
