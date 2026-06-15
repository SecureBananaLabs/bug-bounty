// In-memory admin data store (replace with DB queries in production)
let users = [
  { id: "u1", name: "Alice Admin", email: "admin@example.com", role: "admin", status: "active", createdAt: "2025-01-01" },
  { id: "u2", name: "Bob Client", email: "bob@example.com", role: "client", status: "active", createdAt: "2025-02-15" },
  { id: "u3", name: "Charlie Freelancer", email: "charlie@example.com", role: "freelancer", status: "active", createdAt: "2025-03-10" },
  { id: "u4", name: "Diana Dev", email: "diana@example.com", role: "freelancer", status: "suspended", createdAt: "2025-03-20" },
];

let jobs = [
  { id: "j1", title: "Build E-commerce API", clientName: "Bob Client", status: "open", flagged: false, createdAt: "2025-04-01" },
  { id: "j2", title: "Fix Auth Vulnerability", clientName: "Alice Admin", status: "in_progress", flagged: true, createdAt: "2025-04-10" },
  { id: "j3", title: "Design Landing Page", clientName: "Bob Client", status: "completed", flagged: false, createdAt: "2025-03-15" },
];

let disputes = [
  { id: "d1", jobId: "j2", raisedBy: "Charlie Freelancer", reason: "Scope changed after agreement", status: "open", createdAt: "2025-04-12" },
];

export async function getAdminMetrics() {
  return {
    totalUsers: users.length,
    openJobs: jobs.filter(j => j.status === "open").length,
    activeFreelancers: users.filter(u => u.role === "freelancer" && u.status === "active").length,
    openDisputes: disputes.filter(d => d.status === "open").length,
    monthlyVolume: 128900,
    flaggedAccounts: users.filter(u => u.status === "suspended").length,
  };
}

export async function listUsers() { return users; }

export async function updateUser(id, action) {
  const user = users.find(u => u.id === id);
  if (!user) return null;
  switch (action) {
    case "promote": user.role = "admin"; break;
    case "demote": user.role = "client"; break;
    case "ban": user.status = "banned"; break;
    case "suspend": user.status = "suspended"; break;
    case "activate": user.status = "active"; break;
  }
  return user;
}

export async function listJobs() { return jobs; }

export async function updateJob(id, action) {
  const job = jobs.find(j => j.id === id);
  if (!job) return null;
  switch (action) {
    case "flag": job.flagged = true; break;
    case "unflag": job.flagged = false; break;
    case "remove": job.status = "removed"; break;
    case "approve": job.status = "open"; break;
  }
  return job;
}

export async function listDisputes() { return disputes; }

export async function resolveDispute(id, resolution) {
  const dispute = disputes.find(d => d.id === id);
  if (!dispute) return null;
  dispute.status = "resolved";
  dispute.resolution = resolution;
  dispute.resolvedAt = new Date().toISOString();
  return dispute;
}

export async function getHealth() {
  return {
    api: "online",
    database: "connected",
    cache: "operational",
    queue: "processing",
    uptime: "99.97%",
    responseTime: "124ms",
    timestamp: new Date().toISOString(),
  };
}