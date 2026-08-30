import type { CSSProperties } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Freelancer Search",
  description: "Browse and search freelancers by skills, rate, and location.",
};

interface Freelancer {
  id: string;
  name: string;
  headline: string;
  location: string;
  hourlyRate: number;
  skills: string[];
}

// Mock listing for the freelancer search page.
// The skills line is rendered as plain ASCII via skills.join(", ").
const FREELANCERS: Freelancer[] = [
  {
    id: "fr-001",
    name: "Amara Osei",
    headline: "Senior full-stack engineer",
    location: "Accra, Ghana",
    hourlyRate: 65,
    skills: ["TypeScript", "React", "Node.js", "PostgreSQL"],
  },
  {
    id: "fr-002",
    name: "Diego Ramirez",
    headline: "Product designer for web and mobile",
    location: "Mexico City, Mexico",
    hourlyRate: 55,
    skills: ["Figma", "Design Systems", "Prototyping", "Accessibility"],
  },
  {
    id: "fr-003",
    name: "Priya Nair",
    headline: "Data engineer and analytics specialist",
    location: "Bengaluru, India",
    hourlyRate: 70,
    skills: ["Python", "SQL", "dbt", "Airflow", "BigQuery"],
  },
  {
    id: "fr-004",
    name: "Tomasz Kowalski",
    headline: "DevOps and platform reliability engineer",
    location: "Warsaw, Poland",
    hourlyRate: 75,
    skills: ["Kubernetes", "Terraform", "AWS", "CI/CD"],
  },
  {
    id: "fr-005",
    name: "Hannah Lee",
    headline: "Mobile engineer for iOS and Android",
    location: "Seoul, South Korea",
    hourlyRate: 68,
    skills: ["Swift", "Kotlin", "React Native", "GraphQL"],
  },
];

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f7f6f2",
    color: "#22272e",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    padding: "48px 24px",
  },
  container: {
    maxWidth: "880px",
    margin: "0 auto",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    lineHeight: 1.2,
    color: "#0f766e",
  },
  subtitle: {
    marginTop: "8px",
    marginBottom: "32px",
    fontSize: "15px",
    color: "#5c6570",
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e3e0d8",
    borderRadius: "10px",
    padding: "20px",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
  },
  name: {
    margin: 0,
    fontSize: "18px",
    lineHeight: 1.3,
  },
  headline: {
    margin: "4px 0 0",
    fontSize: "14px",
    color: "#5c6570",
  },
  rate: {
    flexShrink: 0,
    fontSize: "14px",
    fontWeight: 600,
    color: "#0f766e",
    backgroundColor: "#e6f2f0",
    borderRadius: "999px",
    padding: "4px 10px",
  },
  meta: {
    margin: "12px 0 0",
    fontSize: "13px",
    color: "#5c6570",
  },
  skills: {
    margin: "8px 0 0",
    fontSize: "14px",
    color: "#22272e",
  },
  skillsLabel: {
    fontWeight: 600,
  },
};

export default function FreelancerSearchPage() {
  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header>
          <h1 style={styles.title}>Find freelancers</h1>
          <p style={styles.subtitle}>
            Browse available freelancers and match them to the skills your project needs.
          </p>
        </header>
        <ul style={styles.list}>
          {FREELANCERS.map(({ id, name, headline, location, hourlyRate, skills }) => (
            <li key={id} style={styles.card}>
              <div style={styles.cardTop}>
                <div>
                  <h2 style={styles.name}>{name}</h2>
                  <p style={styles.headline}>{headline}</p>
                </div>
                <span style={styles.rate}>${hourlyRate}/hr</span>
              </div>
              <p style={styles.meta}>{location}</p>
              <p style={styles.skills}>
                <span style={styles.skillsLabel}>Skills:</span>{" "}
                {skills.join(", ")}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
