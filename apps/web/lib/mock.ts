export const jobs = [
  {
    id: "job-101",
    title: "Build an AI customer support widget",
    budget: "$1,500",
    summary: "Create a responsive support widget with AI-assisted answers and escalation paths."
  },
  {
    id: "job-102",
    title: "Migrate legacy API to Node.js",
    budget: "$2,800",
    summary: "Move a legacy API surface to Node.js while preserving existing client contracts."
  },
  {
    id: "job-103",
    title: "Design SaaS onboarding flows",
    budget: "$900",
    summary: "Design onboarding screens and activation checkpoints for a SaaS product."
  }
];

export function findJobById(id: string) {
  return jobs.find((job) => job.id === id) ?? null;
}

export const freelancers = [
  { username: "maya-dev", skills: ["Next.js", "TypeScript"], rate: "$65/hr" },
  { username: "jordan-ux", skills: ["Figma", "UX Research"], rate: "$52/hr" }
];
