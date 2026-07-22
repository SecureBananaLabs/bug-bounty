import { listUsers } from "./userService.js";
import { listJobs } from "./jobService.js";

export async function globalSearch(query) {
  const q = query.toLowerCase();
  const allUsers = await listUsers();
  const allJobs = await listJobs();
  
  const users = allUsers.filter(u => u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  const jobs = allJobs.filter(j => j.title?.toLowerCase().includes(q) || j.description?.toLowerCase().includes(q));

  return {
    query,
    users,
    jobs,
    freelancers: []
  };
}
