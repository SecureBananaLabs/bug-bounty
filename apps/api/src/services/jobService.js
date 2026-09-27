const jobs = [
  {
    id: "job-101",
    title: "Build an AI customer support widget",
    budget: "$1,500",
    status: "open"
  },
  {
    id: "job-102",
    title: "Migrate legacy API to Node.js",
    budget: "$2,800",
    status: "open"
  },
  {
    id: "job-103",
    title: "Design SaaS onboarding flows",
    budget: "$900",
    status: "open"
  }
];

function snapshot(job) {
  return { ...job };
}

export async function listJobs() {
  return jobs.map(snapshot);
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, status: "open", ...payload };
  jobs.push(job);
  return snapshot(job);
}
