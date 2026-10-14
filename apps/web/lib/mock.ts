export const jobs = [
  {
    id: "job-101",
    title: "Build an AI customer support widget",
    budget: "$1,500",
    category: "Engineering",
    description: "Create an embeddable support widget with a small admin flow, conversation history, and API hooks.",
    skills: ["Next.js", "OpenAI", "TypeScript"]
  },
  {
    id: "job-102",
    title: "Migrate legacy API to Node.js",
    budget: "$2,800",
    category: "Backend",
    description: "Move a legacy REST API into a Node.js service while preserving existing auth and reporting behavior.",
    skills: ["Node.js", "Express", "PostgreSQL"]
  },
  {
    id: "job-103",
    title: "Design SaaS onboarding flows",
    budget: "$900",
    category: "Design",
    description: "Design a compact onboarding experience for teams, invitations, billing setup, and first project creation.",
    skills: ["Figma", "UX Research", "Product Design"]
  }
];

export const freelancers = [
  {
    username: "maya-dev",
    name: "Maya Chen",
    headline: "Full-stack product engineer",
    bio: "Builds polished SaaS features across Next.js, API design, and pragmatic AI integrations.",
    skills: ["Next.js", "TypeScript"],
    rate: "$65/hr"
  },
  {
    username: "jordan-ux",
    name: "Jordan Lee",
    headline: "UX researcher and interface designer",
    bio: "Turns ambiguous product ideas into clear flows, prototypes, and user-tested interface patterns.",
    skills: ["Figma", "UX Research"],
    rate: "$52/hr"
  }
];

export function getJobById(id: string) {
  return jobs.find((job) => job.id === id);
}

export function getFreelancerByUsername(username: string) {
  return freelancers.find((freelancer) => freelancer.username === username);
}
