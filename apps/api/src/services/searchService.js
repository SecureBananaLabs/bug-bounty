import { listJobs } from "./jobService.js";
import { listUsers } from "./userService.js";

export async function globalSearch(query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) {
    return {
      query: "",
      users: [],
      jobs: [],
      freelancers: []
    };
  }

  const terms = q.split(/\s+/).filter(Boolean);

  const allJobs = await listJobs();
  const allUsers = await listUsers();

  const matchedJobs = allJobs.filter((job) => {
    const text = `${job.title || ""} ${job.description || ""} ${(job.skills || []).join(" ")}`.toLowerCase();
    return terms.every((term) => text.includes(term));
  });

  const matchedUsers = allUsers.filter((user) => {
    const text = `${user.name || ""} ${user.email || ""}`.toLowerCase();
    return terms.every((term) => text.includes(term));
  });

  const matchedFreelancers = matchedUsers.filter((u) => u.role === "freelancer");

  return {
    query: q,
    users: matchedUsers,
    jobs: matchedJobs,
    freelancers: matchedFreelancers
  };
}
