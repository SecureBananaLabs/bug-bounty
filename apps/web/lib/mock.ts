// Mock data backing the freelancer search page (apps/web).
//
// NOTE(issue #9297): skills were previously joined with a corrupted
// middle-dot sequence (" \u00c2\u00b7 ") that rendered as mojibake in the UI.
// They are now joined with a plain ASCII comma for a stable, readable
// separator.

export interface Freelancer {
  id: string;
  name: string;
  title: string;
  skills: string;
  hourlyRate: number;
  location: string;
  rating: number;
}

// Single source of truth for the separator used to join a freelancer's
// skills for display. Must stay plain ASCII to avoid encoding artifacts.
export const SKILL_SEPARATOR = ", ";

const joinSkills = (skills: string[]): string => skills.join(SKILL_SEPARATOR);

export const freelancers: Freelancer[] = [
  {
    id: "fl-1",
    name: "Maya Chen",
    title: "Senior Full-Stack Engineer",
    skills: joinSkills(["Next.js", "TypeScript", "React"]),
    hourlyRate: 110,
    location: "Remote",
    rating: 4.9,
  },
  {
    id: "fl-2",
    name: "Diego Ram\u00edrez",
    title: "Frontend Specialist",
    skills: joinSkills(["React", "Tailwind CSS", "GraphQL"]),
    hourlyRate: 85,
    location: "Mexico City",
    rating: 4.7,
  },
  {
    id: "fl-3",
    name: "Priya Nair",
    title: "Backend Engineer",
    skills: joinSkills(["Node.js", "PostgreSQL", "Redis"]),
    hourlyRate: 95,
    location: "Bengaluru",
    rating: 4.8,
  },
  {
    id: "fl-4",
    name: "Tomasz Kowalski",
    title: "DevOps Engineer",
    skills: joinSkills(["Kubernetes", "Terraform", "AWS"]),
    hourlyRate: 120,
    location: "Warsaw",
    rating: 4.6,
  },
];

export function searchFreelancers(query: string): Freelancer[] {
  const q = query.trim().toLowerCase();
  if (!q) return freelancers;
  return freelancers.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.title.toLowerCase().includes(q) ||
      f.skills.toLowerCase().includes(q)
  );
}
