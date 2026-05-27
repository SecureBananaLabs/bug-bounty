export const jobs = [
  {
    id: "job-101",
    title: "Build an AI customer support widget",
    budget: "$1,500",
    description: "Create a lightweight support assistant with handoff flows and analytics."
  },
  {
    id: "job-102",
    title: "Migrate legacy API to Node.js",
    budget: "$2,800",
    description: "Move an aging REST API to the platform Node.js service layer."
  },
  {
    id: "job-103",
    title: "Design SaaS onboarding flows",
    budget: "$900",
    description: "Map and prototype onboarding paths for a B2B SaaS dashboard."
  }
];

export const freelancers = [
  {
    username: "maya-dev",
    skills: ["Next.js", "TypeScript"],
    rate: "$65/hr",
    summary: "Frontend engineer focused on production-ready React dashboards."
  },
  {
    username: "jordan-ux",
    skills: ["Figma", "UX Research"],
    rate: "$52/hr",
    summary: "Product designer who turns research into clear onboarding flows."
  }
];

export function findJobById(id: string) {
  return jobs.find((job) => job.id === id);
}

export function findFreelancerByUsername(username: string) {
  return freelancers.find((freelancer) => freelancer.username === username);
}
