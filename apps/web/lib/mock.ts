export const jobs = [
  { 
    id: "job-101", 
    title: "Build an AI customer support widget", 
    budget: "$1,500",
    context: "Develop a responsive React widget integrated with OpenAI API for automated customer query resolution."
  },
  { 
    id: "job-102", 
    title: "Migrate legacy API to Node.js", 
    budget: "$2,800",
    context: "Refactor a monolithic Ruby on Rails backend into a high-performance Node.js microservice architecture."
  },
  { 
    id: "job-103", 
    title: "Design SaaS onboarding flows", 
    budget: "$900",
    context: "Create intuitive user onboarding experiences for a B2B project management platform."
  }
];

export const freelancers = [
  { 
    username: "maya-dev", 
    name: "Maya Chen",
    skills: ["Next.js", "TypeScript", "Tailwind CSS"], 
    rate: "$65/hr",
    bio: "Full-stack developer specializing in modern React applications and scalable cloud architecture."
  },
  { 
    username: "jordan-ux", 
    name: "Jordan Smith",
    skills: ["Figma", "UX Research", "Design Systems"], 
    rate: "$52/hr",
    bio: "User experience designer focused on creating intuitive and accessible digital products for enterprises."
  }
];

export const getJobById = (id: string) => jobs.find(j => j.id === id) || null;
export const getFreelancerByUsername = (username: string) => freelancers.find(f => f.username === username) || null;
