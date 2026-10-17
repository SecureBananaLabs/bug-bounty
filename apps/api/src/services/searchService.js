import { listJobs } from "./jobService.js";
import { listUsers } from "./userService.js";

function normalizeQuery(query) {
  if (typeof query !== "string") {
    return [];
  }

  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 0);
}

function textOf(record, fields) {
  return fields
    .map((field) => {
      const value = record?.[field];
      return typeof value === "string" ? value.toLowerCase() : String(value ?? "").toLowerCase();
    })
    .join(" ");
}

function matches(record, fields, terms) {
  const text = textOf(record, fields);
  return terms.every((term) => text.includes(term));
}

export async function globalSearch(query) {
  const terms = normalizeQuery(query);
  const normalized = terms.join(" ");
  const [jobs, users] = await Promise.all([listJobs(), listUsers()]);

  if (terms.length === 0) {
    return { query: normalized, users: [], jobs: [], freelancers: [] };
  }

  const matchedJobs = jobs.filter((job) => matches(job, ["title", "description", "skills"], terms));
  const matchedUsers = users.filter((user) => matches(user, ["fullName", "email", "role"], terms));
  const freelancers = matchedUsers.filter((user) => user.role === "freelancer");

  return { query: normalized, users: matchedUsers, jobs: matchedJobs, freelancers };
}
