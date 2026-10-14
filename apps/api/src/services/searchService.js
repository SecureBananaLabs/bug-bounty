import { listUsers } from "./userService.js";
import { listJobs } from "./jobService.js";

/**
 * Case-insensitive substring search with bounding.
 * @param {string} query
 * @param {Array} items - items to search through
 * @param {Array<string>} fields - field names to search in
 * @returns {Array} matching items
 */
function searchItems(query, items, fields) {
  if (!query || typeof query !== "string") return [];
  const lowerQuery = query.toLowerCase();
  return items.filter((item) =>
    fields.some((field) => {
      const val = item[field];
      if (typeof val !== "string") return false;
      return val.toLowerCase().includes(lowerQuery);
    })
  );
}

export async function globalSearch(query) {
  const boundedQuery = query.trim().slice(0, 200);

  // Fetch from in-memory stores
  const [users, jobs] = await Promise.all([listUsers(), listJobs()]);

  // Search users by email and name
  const matchedUsers = searchItems(boundedQuery, users, ["email", "name"]);

  // Search jobs by title and description
  const matchedJobs = searchItems(boundedQuery, jobs, ["title", "description"]);

  // Freelancers are not separately stored — users with role "freelancer"
  const matchedFreelancers = matchedUsers.filter(
    (u) => u.role === "freelancer" || u.role === "freelance"
  );

  return {
    query: boundedQuery,
    users: matchedUsers,
    jobs: matchedJobs,
    freelancers: matchedFreelancers,
  };
}