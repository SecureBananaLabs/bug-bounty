// Sample marketplace jobs (mirrors web app seed data)
const SEED_JOBS = [
  {
    id: "job_seed_001",
    title: "Full-Stack React Developer",
    description: "Build modern web applications using React, TypeScript, and Node.js.",
    budgetMin: 5000,
    budgetMax: 8000,
    status: "open",
    skills: ["React", "TypeScript", "Node.js", "Tailwind CSS"],
    clientId: "client_demo_001",
    createdAt: new Date("2025-01-15").toISOString(),
  },
  {
    id: "job_seed_002",
    title: "Python Data Pipeline Engineer",
    design: "Design and maintain ETL pipelines processing 10M+ records daily.",
    budgetMin: 7000,
    budgetMax: 12000,
    status: "open",
    skills: ["Python", "Apache Airflow", "PostgreSQL", "Docker"],
    clientId: "client_demo_002",
    createdAt: new Date("2025-02-01").toISOString(),
  },
  {
    id: "job_seed_003",
    title: "UI/UX Designer – Freelance Marketplace Redesign",
    description: "Redesign the freelancer dashboard and job listing experience.",
    budgetMin: 3000,
    budgetMax: 6000,
    status: "open",
    skills: ["Figma", "UI Design", "UX Research", "Prototyping"],
    clientId: "client_demo_003",
    createdAt: new Date("2025-02-20").toISOString(),
  },
];

// In-memory job store — seeded with sample data
const jobs = [...SEED_JOBS];

export async function listJobs() {
  // Return defensive copies so callers cannot mutate stored records
  return jobs.map((job) => ({ ...job }));
}

export async function createJob(payload) {
  const job = { id: `job_${Date.now()}`, status: "open", createdAt: new Date().toISOString(), ...payload };
  jobs.push(job);
  // Return a copy, not the internal reference
  return { ...job };
}
