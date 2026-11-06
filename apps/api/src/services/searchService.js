import { listRegisteredUsers } from "./authService.js";
import { listJobs } from "./jobService.js";
import { listUsers } from "./userService.js";

function normalizeQuery(query) {
  return typeof query === "string" ? query.trim() : String(query ?? "").trim();
}

function matchesQuery(record, needle) {
  return JSON.stringify(record).toLowerCase().includes(needle);
}

function dedupeUsers(users) {
  const byKey = new Map();

  for (const user of users) {
    const key = user.email ?? user.id;
    if (!byKey.has(key)) {
      byKey.set(key, user);
    }
  }

  return Array.from(byKey.values());
}

function toFreelancer(user) {
  return {
    ...user,
    username: user.username ?? user.name ?? user.email.split("@")[0]
  };
}

export async function globalSearch(query) {
  const searchTerm = normalizeQuery(query);
  const needle = searchTerm.toLowerCase();

  if (!needle) {
    return {
      query: searchTerm,
      users: [],
      jobs: [],
      freelancers: []
    };
  }

  const [registeredUsers, apiUsers, jobs] = await Promise.all([
    listRegisteredUsers(),
    listUsers(),
    listJobs()
  ]);

  const users = dedupeUsers([...registeredUsers, ...apiUsers]).filter((user) => matchesQuery(user, needle));
  const freelancers = users.filter((user) => user.role === "freelancer").map(toFreelancer);

  return {
    query: searchTerm,
    users,
    jobs: jobs.filter((job) => matchesQuery(job, needle)),
    freelancers
  };
}
