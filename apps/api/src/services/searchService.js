const SAMPLE_JOBS = [
  { id: "job-101", title: "Build an AI customer support widget", description: "Build an AI-powered customer support widget using Node.js and React.", skills: ["AI", "Node.js", "React"], budget: "$1,500", client: "client-1" },
  { id: "job-102", title: "Migrate legacy API to Node.js", description: "Migrate a legacy REST API to modern Node.js.", skills: ["Node.js", "API", "Migration"], budget: "$2,800", client: "client-2" },
  { id: "job-103", title: "Design SaaS onboarding flows", description: "Design user onboarding flows for a SaaS platform.", skills: ["Figma", "UX", "Design"], budget: "$900", client: "client-3" }
];

const SAMPLE_FREELANCERS = [
  { username: "maya-dev", skills: ["Next.js", "TypeScript", "React"], rate: "$65/hr", bio: "Full-stack developer specializing in Next.js and TypeScript." },
  { username: "jordan-ux", skills: ["Figma", "UX Research", "Design"], rate: "$52/hr", bio: "UX designer with expertise in Figma and user research." }
];

export async function globalSearch(query) {
  const q = (query || "").toLowerCase().trim();
  if (!q) {
    return { query, users: [], jobs: [], freelancers: [] };
  }
  const jobs = SAMPLE_JOBS.filter(j =>
    j.title.toLowerCase().includes(q) ||
    j.skills.some(s => s.toLowerCase().includes(q)) ||
    j.description.toLowerCase().includes(q)
  );
  const freelancers = SAMPLE_FREELANCERS.filter(f =>
    f.username.toLowerCase().includes(q) ||
    f.skills.some(s => s.toLowerCase().includes(q)) ||
    f.bio.toLowerCase().includes(q)
  );
  return { query, users: [], jobs, freelancers };
}
