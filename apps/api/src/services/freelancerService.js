/**
 * Freelancer profile service.
 * Resolves mock profiles by username or ID (#2849).
 */

const MOCK_PROFILES = {
  alice_dev: {
    username: "alice_dev",
    name: "Alice Chen",
    skills: ["React", "Node.js", "TypeScript"],
    hourlyRate: 45,
    rating: 4.8,
    completedJobs: 32,
    bio: "Full-stack developer specializing in React and Node.js",
  },
  bob_pm: {
    username: "bob_pm",
    name: "Bob Martinez",
    skills: ["Product Management", "Agile", "SaaS"],
    hourlyRate: 60,
    rating: 4.9,
    completedJobs: 18,
    bio: "Product manager with 8 years of SaaS experience",
  },
};

export async function getFreelancerByUsername(username) {
  if (!username || typeof username !== "string") {
    return null;
  }
  const normalized = username.trim().toLowerCase();
  return MOCK_PROFILES[normalized] || null;
}

export async function getFreelancerById(id) {
  if (!id || typeof id !== "string") {
    return null;
  }
  // Mock: iterate profiles, match against generated ID
  for (const [username, profile] of Object.entries(MOCK_PROFILES)) {
    if (id === `usr_${username}` || id === username) {
      return { id: `usr_${username}`, ...profile };
    }
  }
  return null;
}
