const SAMPLE_JOBS = [
  { id: "job-101", title: "Build an AI customer support widget", budget: "$1,500", status: "open", clientId: "client-1", categoryId: "dev", skills: ["AI", "Node.js", "React"], description: "Build an AI-powered customer support widget using Node.js and React." },
  { id: "job-102", title: "Migrate legacy API to Node.js", budget: "$2,800", status: "open", clientId: "client-2", categoryId: "dev", skills: ["Node.js", "API", "Migration"], description: "Migrate a legacy REST API to modern Node.js." },
  { id: "job-103", title: "Design SaaS onboarding flows", budget: "$900", status: "open", clientId: "client-3", categoryId: "design", skills: ["Figma", "UX", "Design"], description: "Design user onboarding flows for a SaaS platform." }
];

const jobs = [...SAMPLE_JOBS];

export async function listJobs() {
  return jobs.map(j => ({ ...j }));
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, status: "open", ...payload };
  jobs.push(job);
  return { ...job };
}
