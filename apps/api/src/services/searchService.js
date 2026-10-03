import { users } from "./userService.js";
import { jobs } from "./jobService.js";

/**
 * Global search across users and jobs.
 * Matches query string against name, email, title, description (case-insensitive).
 * Replace with PostgreSQL full-text search / Meilisearch / Algolia in production.
 */
export async function globalSearch(query) {
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return { query: "", users: [], jobs: [], freelancers: [] };
  }

  const q = query.trim().toLowerCase();
  const matcher = (text) => (text || "").toLowerCase().includes(q);

  const matchedUsers = users
    .filter((u) => matcher(u.email) || matcher(u.fullName) || matcher(u.role))
    .map(({ password: _, ...rest }) => rest); // strip password

  const matchedJobs = jobs
    .filter((j) => matcher(j.title) || matcher(j.description) || matcher(j.status));

  const freelancers = matchedUsers.filter((u) => u.role === "freelancer");

  return {
    query,
    users: matchedUsers,
    jobs: matchedJobs,
    freelancers,
  };
}
