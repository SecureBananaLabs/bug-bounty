import { listJobs } from "./jobService.js";
import { listUsers } from "./userService.js";

export async function globalSearch(rawQuery = "") {
  const query = typeof rawQuery === "string" ? rawQuery : "";
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      query,
      users: [],
      jobs: [],
      freelancers: []
    };
  }

  const terms = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  const [allUsers, allJobs] = await Promise.all([listUsers(), listJobs()]);

  const matchesAllTerms = (text) => {
    const lower = (text || "").toLowerCase();
    return terms.every((term) => lower.includes(term));
  };

  const matchedUsers = allUsers.filter((user) => {
    const haystack = [
      user.name,
      user.fullName,
      user.email,
      user.role,
      ...(user.skills || [])
    ].filter(Boolean).join(" ");
    return matchesAllTerms(haystack);
  });

  const matchedJobs = allJobs.filter((job) => {
    const haystack = [
      job.title,
      job.description,
      job.categoryId,
      ...(job.skills || [])
    ].filter(Boolean).join(" ");
    return matchesAllTerms(haystack);
  });

  const matchedFreelancers = matchedUsers.filter((u) => u.role === "freelancer");

  return {
    query,
    users: matchedUsers,
    jobs: matchedJobs,
    freelancers: matchedFreelancers
  };
}
