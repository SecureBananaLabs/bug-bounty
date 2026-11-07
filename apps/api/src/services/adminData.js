export const adminUsers = [
  {
    id: "usr_admin_1",
    email: "admin@freelanceflow.test",
    fullName: "Priya Admin",
    role: "admin",
    status: "active",
    joinedAt: "2025-11-20T10:00:00.000Z",
    trustScore: 99,
    activeJobs: 0,
    disputeCount: 0
  },
  {
    id: "usr_client_1",
    email: "client@acme.test",
    fullName: "Avery Client",
    role: "client",
    status: "active",
    joinedAt: "2026-01-12T14:30:00.000Z",
    trustScore: 82,
    activeJobs: 4,
    disputeCount: 1
  },
  {
    id: "usr_client_2",
    email: "ops@northstar.test",
    fullName: "Northstar Ops",
    role: "client",
    status: "suspended",
    joinedAt: "2026-03-03T09:15:00.000Z",
    trustScore: 38,
    activeJobs: 1,
    disputeCount: 3
  },
  {
    id: "usr_free_1",
    email: "maya.dev@example.test",
    fullName: "Maya Dev",
    role: "freelancer",
    status: "active",
    joinedAt: "2025-12-08T18:45:00.000Z",
    trustScore: 94,
    activeJobs: 2,
    disputeCount: 0
  },
  {
    id: "usr_free_2",
    email: "jordan.ux@example.test",
    fullName: "Jordan UX",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-02-22T11:20:00.000Z",
    trustScore: 76,
    activeJobs: 3,
    disputeCount: 1
  },
  {
    id: "usr_free_3",
    email: "casey.copy@example.test",
    fullName: "Casey Copy",
    role: "freelancer",
    status: "banned",
    joinedAt: "2026-04-02T16:10:00.000Z",
    trustScore: 14,
    activeJobs: 0,
    disputeCount: 5
  }
];

export const flaggedListings = [
  {
    id: "flag_101",
    jobId: "job_101",
    title: "Build payment gateway with copied credentials",
    ownerId: "usr_client_2",
    ownerName: "Northstar Ops",
    reason: "Possible credential sharing in job brief",
    status: "flagged",
    riskLevel: "high",
    flaggedAt: "2026-05-16T09:20:00.000Z"
  },
  {
    id: "flag_102",
    jobId: "job_102",
    title: "Urgent scraper for private marketplace",
    ownerId: "usr_client_1",
    ownerName: "Avery Client",
    reason: "Terms-of-service risk detected",
    status: "flagged",
    riskLevel: "medium",
    flaggedAt: "2026-05-16T12:45:00.000Z"
  },
  {
    id: "flag_103",
    jobId: "job_103",
    title: "Brand-safe landing page redesign",
    ownerId: "usr_client_1",
    ownerName: "Avery Client",
    reason: "User report: unclear payment terms",
    status: "escalated",
    riskLevel: "low",
    flaggedAt: "2026-05-15T17:05:00.000Z"
  }
];

export const disputes = [
  {
    id: "disp_201",
    jobTitle: "Migrate legacy API to Node.js",
    clientId: "usr_client_1",
    clientName: "Avery Client",
    freelancerId: "usr_free_2",
    freelancerName: "Jordan UX",
    amount: 2800,
    currency: "USD",
    status: "open",
    openedAt: "2026-05-14T13:10:00.000Z",
    summary: "Client says milestone 2 is incomplete; freelancer provided deployment evidence.",
    evidenceCount: 4
  },
  {
    id: "disp_202",
    jobTitle: "Design SaaS onboarding flows",
    clientId: "usr_client_2",
    clientName: "Northstar Ops",
    freelancerId: "usr_free_1",
    freelancerName: "Maya Dev",
    amount: 900,
    currency: "USD",
    status: "under_review",
    openedAt: "2026-05-12T20:25:00.000Z",
    summary: "Both parties disagree on scope expansion after initial approval.",
    evidenceCount: 7
  }
];

export const platformControls = {
  registrationsEnabled: true,
  jobPostingsEnabled: true
};

export const auditLogs = [
  {
    id: "audit_001",
    adminId: "usr_admin_1",
    actionType: "platform.initialized",
    targetType: "system",
    targetId: "platform",
    detail: "Admin panel audit log initialized",
    createdAt: "2026-05-15T08:00:00.000Z"
  }
];
