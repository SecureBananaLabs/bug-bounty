const searchIndex = {
  jobs: [
    {
      id: "job-101",
      title: "Build an AI customer support widget",
      budget: "$1,500",
      category: "AI automation",
      description: "Support widget with triage flows, analytics events, and handoff states."
    },
    {
      id: "job-102",
      title: "Migrate legacy API to Node.js",
      budget: "$2,800",
      category: "Backend",
      description: "Legacy API migration with route ownership and regression coverage."
    },
    {
      id: "job-103",
      title: "Design SaaS onboarding flows",
      budget: "$900",
      category: "Product design",
      description: "Onboarding prototypes, empty states, and design handoff notes."
    }
  ],
  freelancers: [
    {
      username: "maya-dev",
      skills: ["Next.js", "TypeScript"],
      rate: "$65/hr",
      focus: "Frontend systems"
    },
    {
      username: "jordan-ux",
      skills: ["Figma", "UX Research"],
      rate: "$52/hr",
      focus: "Product discovery"
    }
  ],
  users: [
    { id: "usr-client", name: "Client workspace", role: "client", email: "client@example.com" },
    { id: "usr-freelancer", name: "Freelancer workspace", role: "freelancer", email: "freelancer@example.com" }
  ]
};

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function searchableText(record) {
  return Object.values(record)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map(normalize)
    .join(" ");
}

function filterGroup(group, query) {
  if (!query) {
    return [];
  }

  return group.filter((record) => searchableText(record).includes(query));
}

export async function globalSearch(query) {
  const normalizedQuery = normalize(query);

  return {
    query: normalizedQuery,
    users: filterGroup(searchIndex.users, normalizedQuery),
    jobs: filterGroup(searchIndex.jobs, normalizedQuery),
    freelancers: filterGroup(searchIndex.freelancers, normalizedQuery)
  };
}
