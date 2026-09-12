import { listJobs } from "./jobService.js";
import { listUsers } from "./userService.js";

const SEARCHABLE_USER_FIELDS = ["id", "email", "name", "role"];
const SEARCHABLE_JOB_FIELDS = ["id", "title", "description", "categoryId", "status"];

function matchesQuery(record, fields, query) {
  return fields.some((field) => String(record[field] ?? "").toLowerCase().includes(query));
}

export async function globalSearch(query) {
  const normalizedQuery = String(query ?? "").trim().toLowerCase();
  const [users, jobs] = await Promise.all([listUsers(), listJobs()]);

  if (!normalizedQuery) {
    return {
      query: "",
      users: [],
      jobs: [],
      freelancers: []
    };
  }

  return {
    query: normalizedQuery,
    users: users.filter((user) => matchesQuery(user, SEARCHABLE_USER_FIELDS, normalizedQuery)),
    jobs: jobs.filter((job) => matchesQuery(job, SEARCHABLE_JOB_FIELDS, normalizedQuery)),
    freelancers: []
  };
}
