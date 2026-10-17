import { listJobs } from "./jobService.js";
import { listUsers } from "./userService.js";

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function matches(terms, candidate) {
  const haystack = normalize(candidate);
  return terms.every((term) => haystack.includes(term));
}

export async function globalSearch(query) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);

  if (terms.length === 0) {
    return { query: normalize(query), users: [], jobs: [], freelancers: [] };
  }

  const users = await listUsers();
  const jobs = await listJobs();

  const matchedUsers = users.filter((user) => matches(terms, `${user.email} ${user.role}`));
  const matchedJobs = jobs.filter((job) => {
    const skills = Array.isArray(job.skills) ? job.skills.join(" ") : "";
    return matches(terms, `${job.title} ${job.description} ${skills}`);
  });

  return {
    query: normalize(query),
    users: matchedUsers,
    jobs: matchedJobs,
    freelancers: matchedUsers.filter((user) => user.role === "freelancer")
  };
}
