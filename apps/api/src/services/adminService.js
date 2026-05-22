// ---------- In-memory mock stores ----------

const mockUsers = Array.from({ length: 50 }, (_, i) => {
  const roles = ["CLIENT", "FREELANCER", "ADMIN"];
  const role = roles[i % 3];
  const statuses = ["active", "active", "active", "suspended", "banned"];
  const status = statuses[i % 5];
  return {
    id: `user-${String(i + 1).padStart(3, "0")}`,
    email: `${role.toLowerCase()}${i + 1}@example.com`,
    fullName: `${role === "ADMIN" ? "Admin" : role === "CLIENT" ? "Client" : "Freelancer"} ${i + 1}`,
    role,
    status,
    isVerified: i % 4 !== 0,
    trustScore: Math.round((35 + Math.random() * 65) * 10) / 10,
    completedJobs: Math.floor(Math.random() * 120),
    disputesWon: Math.floor(Math.random() * 8),
    totalEarnings: Math.round(Math.random() * 250000) / 100,
    joinedAt: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 3600 * 1000)).toISOString(),
    lastActive: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 3600 * 1000)).toISOString(),
  };
});

const mockFlaggedJobs = Array.from({ length: 25 }, (_, i) => ({
  id: `job-${String(i + 1).padStart(3, "0")}`,
  title: [
    "Urgent WordPress fix needed",
    "Build React dashboard",
    "API integration with Stripe",
    "Logo redesign for startup",
    "SEO audit for e-commerce site",
    "Mobile app bug fixes",
    "Data scraping script",
    "Smart contract audit",
    "DevOps pipeline setup",
    "Content writing for blog",
    "UI/UX redesign project",
    "Database optimization",
    "Chatbot integration",
    "Email template design",
    "Video editing gig",
    "Penetration testing report",
    "Migration to AWS",
    "Social media marketing",
    "Translation services",
    "3D modeling for game",
    "CI/CD with GitHub Actions",
    "Machine learning model",
    "WordPress plugin dev",
    "Landing page A/B test",
    "WebSocket real-time chat",
  ][i],
  clientName: `Client ${i + 1}`,
  clientId: `user-${String((i % 25) + 1).padStart(3, "0")}`,
  budget: Math.round(100 + Math.random() * 9900) / 100,
  flagReason: [
    "Suspicious payment pattern",
    "Inappropriate content detected",
    "Multiple user reports",
    "Potential scam listing",
    "Violates platform terms",
    "Duplicate listing suspected",
    "Misleading description",
    "Contact info in description",
  ][i % 8],
  flagCount: Math.floor(1 + Math.random() * 5),
  status: ["pending", "pending", "pending", "under_review", "escalated"][i % 5],
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 14 * 24 * 3600 * 1000)).toISOString(),
}));

const mockDisputes = Array.from({ length: 20 }, (_, i) => {
  const statuses = ["OPEN", "OPEN", "OPEN", "UNDER_REVIEW", "RESOLVED", "CLOSED"];
  const status = statuses[i % 6];
  return {
    id: `dispute-${String(i + 1).padStart(3, "0")}`,
    jobId: `job-${String((i % 15) + 1).padStart(3, "0")}`,
    jobTitle: `Job title ${(i % 15) + 1}`,
    userId: `user-${String((i % 30) + 1).padStart(3, "0")}`,
    userName: `User ${(i % 30) + 1}`,
    reason: [
      "Payment not released",
      "Work quality dispute",
      "Missed deadline",
      "Scope creep disagreement",
      "Communication breakdown",
      "Incomplete deliverables",
    ][i % 6],
    description: "Detailed description of the dispute between parties regarding project deliverables and payment terms.",
    status,
    resolution: status === "RESOLVED" || status === "CLOSED" ? "Resolved in favor of freelancer after reviewing all evidence." : null,
    reviewedBy: status === "RESOLVED" || status === "CLOSED" ? "admin-001" : null,
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 60 * 24 * 3600 * 1000)).toISOString(),
    updatedAt: new Date(Date.now() - Math.floor(Math.random() * 10 * 24 * 3600 * 1000)).toISOString(),
  };
});

const mockPlatformConfig = {
  registrationOpen: { value: "true", description: "Allow new user registrations" },
  minBudget: { value: "5", description: "Minimum job budget in USD" },
  maxBudget: { value: "100000", description: "Maximum job budget in USD" },
  commissionRate: { value: "10", description: "Platform commission percentage" },
  autoApproveThreshold: { value: "85", description: "Trust score threshold for auto-approval" },
  maxFlagBeforeSuspend: { value: "5", description: "Max flags before auto-suspension" },
  maintenanceMode: { value: "false", description: "Enable platform maintenance mode" },
  disputeTimeout: { value: "30", description: "Dispute auto-escalation timeout in days" },
  requireEmailVerification: { value: "true", description: "Require email verification for new accounts" },
  maxDailyJobs: { value: "3", description: "Maximum jobs a user can post per day" },
};

const auditActions = [
  "user.suspend", "user.reinstate", "user.ban",
  "job.approve", "job.reject", "job.escalate",
  "dispute.resolve", "config.update",
  "user.login", "user.register", "user.verify",
  "job.create", "job.complete", "payment.process",
  "report.review", "content.flag",
];

const auditEntities = ["user", "job", "dispute", "config", "payment", "report"];

const mockAuditLogs = Array.from({ length: 100 }, (_, i) => {
  const actionIdx = i % auditActions.length;
  const entityIdx = i % auditEntities.length;
  return {
    id: `audit-${String(i + 1).padStart(4, "0")}`,
    action: auditActions[actionIdx],
    entityType: auditEntities[entityIdx],
    entityId: `${auditEntities[entityIdx]}-${String((i % 40) + 1).padStart(3, "0")}`,
    performedBy: `admin-${String((i % 3) + 1).padStart(3, "0")}`,
    details: JSON.stringify({
      reason: `Moderation action #${i + 1}`,
      previousState: "active",
      newState: auditActions[actionIdx].split(".")[1],
    }),
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 3600 * 1000)).toISOString(),
  };
});

// ---------- Helper ----------

function paginate(arr, page = 1, limit = 10) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const total = arr.length;
  const totalPages = Math.ceil(total / l);
  const start = (p - 1) * l;
  const items = arr.slice(start, start + l);
  return { items, total, page: p, limit: l, totalPages };
}

// ---------- Dashboard ----------

export async function getAdminMetrics() {
  const distribution = { "90-100": 0, "70-89": 0, "50-69": 0, "30-49": 0, "0-29": 0 };
  mockUsers.forEach((u) => {
    if (u.trustScore >= 90) distribution["90-100"]++;
    else if (u.trustScore >= 70) distribution["70-89"]++;
    else if (u.trustScore >= 50) distribution["50-69"]++;
    else if (u.trustScore >= 30) distribution["30-49"]++;
    else distribution["0-29"]++;
  });

  return {
    openJobs: 42,
    activeFreelancers: 185,
    flaggedAccounts: mockUsers.filter((u) => u.status === "suspended" || u.status === "banned").length,
    monthlyVolume: 128900,
    pendingDisputes: mockDisputes.filter((d) => d.status === "OPEN").length,
    pendingReviews: mockFlaggedJobs.filter((j) => j.status === "pending").length,
    totalUsers: mockUsers.length,
    activeUsers: mockUsers.filter((u) => u.status === "active").length,
    trustScoreDistribution: distribution,
  };
}

// ---------- User management ----------

export async function getUsers({ search, role, status, page, limit } = {}) {
  let filtered = [...mockUsers];

  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (u) => u.fullName.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
    );
  }
  if (role) {
    filtered = filtered.filter((u) => u.role === role.toUpperCase());
  }
  if (status) {
    filtered = filtered.filter((u) => u.status === status.toLowerCase());
  }

  return paginate(filtered, page, limit);
}

export async function getUserDetail(userId) {
  const user = mockUsers.find((u) => u.id === userId);
  if (!user) return null;

  const userJobs = mockFlaggedJobs
    .filter((j) => j.clientId === userId)
    .map((j) => ({ id: j.id, title: j.title, budget: j.budget }));
  const userDisputes = mockDisputes
    .filter((d) => d.userId === userId)
    .map((d) => ({ id: d.id, reason: d.reason, status: d.status }));

  return { ...user, jobs: userJobs, disputes: userDisputes };
}

export async function suspendUser(userId) {
  const user = mockUsers.find((u) => u.id === userId);
  if (!user) return null;
  user.status = "suspended";
  return { ...user };
}

export async function reinstateUser(userId) {
  const user = mockUsers.find((u) => u.id === userId);
  if (!user) return null;
  user.status = "active";
  return { ...user };
}

export async function banUser(userId) {
  const user = mockUsers.find((u) => u.id === userId);
  if (!user) return null;
  user.status = "banned";
  return { ...user };
}

// ---------- Content moderation ----------

export async function getFlaggedJobs({ page, limit } = {}) {
  return paginate([...mockFlaggedJobs], page, limit);
}

export async function approveJob(jobId) {
  const job = mockFlaggedJobs.find((j) => j.id === jobId);
  if (!job) return null;
  job.status = "approved";
  return { ...job };
}

export async function rejectJob(jobId, reason) {
  const job = mockFlaggedJobs.find((j) => j.id === jobId);
  if (!job) return null;
  job.status = "rejected";
  return { ...job, rejectionReason: reason || "Violates platform guidelines" };
}

export async function escalateJob(jobId) {
  const job = mockFlaggedJobs.find((j) => j.id === jobId);
  if (!job) return null;
  job.status = "escalated";
  return { ...job };
}

// ---------- Dispute handling ----------

export async function getDisputes({ status, page, limit } = {}) {
  let filtered = [...mockDisputes];
  if (status) {
    filtered = filtered.filter((d) => d.status === status.toUpperCase());
  }
  return paginate(filtered, page, limit);
}

export async function getDisputeDetail(disputeId) {
  const dispute = mockDisputes.find((d) => d.id === disputeId);
  if (!dispute) return null;
  const messages = [
    { from: dispute.userId, body: "I believe the work was not completed as agreed.", at: dispute.createdAt },
    { from: "admin-001", body: "We are reviewing your case. Please provide supporting evidence.", at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
  ];
  return { ...dispute, messages };
}

export async function ruleDispute(disputeId, resolution, adminId) {
  const dispute = mockDisputes.find((d) => d.id === disputeId);
  if (!dispute) return null;
  dispute.status = "RESOLVED";
  dispute.resolution = resolution;
  dispute.reviewedBy = adminId;
  dispute.updatedAt = new Date().toISOString();
  return { ...dispute };
}

// ---------- Platform controls ----------

export async function getPlatformControls() {
  return Object.entries(mockPlatformConfig).map(([key, cfg]) => ({
    key,
    value: cfg.value,
    description: cfg.description,
  }));
}

export async function updatePlatformControl(key, value, adminId) {
  if (!mockPlatformConfig[key]) return null;
  mockPlatformConfig[key].value = String(value);
  mockPlatformConfig[key].updatedBy = adminId;
  mockPlatformConfig[key].updatedAt = new Date().toISOString();
  return { key, value: mockPlatformConfig[key].value, description: mockPlatformConfig[key].description };
}

// ---------- Audit log ----------

export async function getAuditLog({ action, entityType, page, limit } = {}) {
  let filtered = [...mockAuditLogs];
  if (action) {
    filtered = filtered.filter((l) => l.action === action);
  }
  if (entityType) {
    filtered = filtered.filter((l) => l.entityType === entityType);
  }
  return paginate(filtered, page, limit);
}
