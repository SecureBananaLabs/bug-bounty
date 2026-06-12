export const jobs = [
  {
    id: "job-101",
    title: "Build an AI customer support widget",
    budget: "$1,500",
    summary: "Create an embeddable support widget with AI-assisted replies.",
    milestones: ["Conversation capture", "AI response draft", "Admin handoff"]
  },
  {
    id: "job-102",
    title: "Migrate legacy API to Node.js",
    budget: "$2,800",
    summary: "Move an existing REST API to a maintainable Node.js service.",
    milestones: ["Route parity", "Data migration", "Production rollout"]
  },
  {
    id: "job-103",
    title: "Design SaaS onboarding flows",
    budget: "$900",
    summary: "Design onboarding screens that guide new SaaS users to activation.",
    milestones: ["Journey audit", "Wireframes", "Prototype review"]
  }
];

export const freelancers = [
  {
    username: "maya-dev",
    displayName: "Maya Chen",
    skills: ["Next.js", "TypeScript"],
    rate: "$65/hr",
    bio: "Frontend engineer focused on polished marketplace experiences."
  },
  {
    username: "jordan-ux",
    displayName: "Jordan Rivera",
    skills: ["Figma", "UX Research"],
    rate: "$52/hr",
    bio: "Product designer who turns ambiguous flows into clear interfaces."
  }
];

export function getJobById(id: string) {
  return jobs.find((job) => job.id === id);
}

export function getFreelancerByUsername(username: string) {
  return freelancers.find((freelancer) => freelancer.username === username);
}
