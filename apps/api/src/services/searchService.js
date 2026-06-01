import { listJobs } from "./jobService.js";
import { listUsers } from "./userService.js";

function hasMatch(value, query) {
  const normalized = String(value || "").toLowerCase();
  return normalized.includes(query);
}

export async function globalSearch(query) {
  const normalizedQuery = String(query || "").toLowerCase();
  const [jobs, users] = await Promise.all([listJobs(), listUsers()]);

  const matchedJobs = jobs.filter((job) =>
    ["title", "description", "categoryId"].some((field) => hasMatch(job?.[field], normalizedQuery))
  );
  const matchedUsers = users.filter((user) =>
    ["name", "email"].some((field) => hasMatch(user?.[field], normalizedQuery))
  );

  return {
    query,
    users: matchedUsers,
    jobs: matchedJobs,
    freelancers: matchedUsers,
  };
}
