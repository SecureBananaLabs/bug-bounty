import { listJobs } from "./jobService.js";
import { listUsers } from "./userService.js";

function includesQuery(value, query) {
  return String(value ?? "").toLowerCase().includes(query);
}

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

export async function globalSearch(query) {
  const normalizedQuery = String(query ?? "").trim().toLowerCase();

  if (!normalizedQuery) {
    return {
      query: "",
      users: [],
      jobs: [],
      freelancers: []
    };
  }

  const [users, jobs] = await Promise.all([listUsers(), listJobs()]);

  return {
    query: normalizedQuery,
    users: users
      .filter((user) =>
        [user.email, user.name, user.username, user.role].some((value) => includesQuery(value, normalizedQuery))
      )
      .map(sanitizeUser),
    jobs: jobs.filter((job) =>
      [job.title, job.description, job.categoryId, job.status].some((value) => includesQuery(value, normalizedQuery))
    ),
    freelancers: []
  };
}
