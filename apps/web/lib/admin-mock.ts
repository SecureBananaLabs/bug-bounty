export const adminMetrics = {
  totalUsers: 1842,
  activeJobs: 128,
  openDisputes: 7,
  flaggedListings: 14,
  revenue: 128900,
  trustScoreBuckets: [
    { label: "90-100", count: 12 },
    { label: "80-89", count: 31 },
    { label: "70-79", count: 17 },
    { label: "Below 70", count: 4 }
  ]
};

export const adminUsers = [
  {
    id: "usr_1001",
    name: "Maya Rivera",
    email: "maya@example.com",
    role: "freelancer",
    status: "active",
    joinedAt: "2026-04-04",
    activeJobs: 3,
    disputes: 1,
    profile: {
      headline: "Senior UI engineer",
      location: "Austin, TX",
      bio: "Designs marketplace interfaces and shipping flows.",
      trustScore: 92
    },
    activeJobTitles: ["Design review dashboard", "Email onboarding refresh", "Audit trail polish"],
    disputeHistory: ["Scope dispute over design handoff"],
    lastSeenAt: "2026-05-19"
  },
  {
    id: "usr_1002",
    name: "Jordan Cole",
    email: "jordan@example.com",
    role: "client",
    status: "suspended",
    joinedAt: "2026-04-18",
    activeJobs: 1,
    disputes: 0,
    profile: {
      headline: "Growth lead",
      location: "New York, NY",
      bio: "Hires specialists for product launches.",
      trustScore: 68
    },
    activeJobTitles: ["Analytics migration"],
    disputeHistory: [],
    lastSeenAt: "2026-05-17"
  },
  {
    id: "usr_1003",
    name: "Ava Chen",
    email: "ava@example.com",
    role: "client",
    status: "active",
    joinedAt: "2026-04-22",
    activeJobs: 5,
    disputes: 2,
    profile: {
      headline: "Founder and product owner",
      location: "San Francisco, CA",
      bio: "Runs a small product team and contracts specialists for launch work.",
      trustScore: 88
    },
    activeJobTitles: ["Build onboarding analytics", "Migrate billing notifications", "Design search revamp"],
    disputeHistory: ["Refund request for broken webhook"],
    lastSeenAt: "2026-05-20"
  }
];

export const moderationQueue = [
  {
    id: "job_2001",
    title: "Build onboarding analytics",
    owner: "Ava Chen",
    status: "flagged",
    reason: "Budget mismatch and vague deliverables",
    updatedAt: "2026-05-18"
  },
  {
    id: "job_2003",
    title: "Migrate billing notifications",
    owner: "Tessa Moore",
    status: "escalated",
    reason: "Possible duplicate report",
    updatedAt: "2026-05-19"
  }
];

export const disputes = [
  {
    id: "dsp_3001",
    title: "Scope dispute over design handoff",
    parties: "maya@example.com vs jordan@example.com",
    status: "open",
    evidence: "Screenshots, chat transcript, milestone deliverables",
    amount: "$1,200"
  },
  {
    id: "dsp_3002",
    title: "Refund request for broken webhook",
    parties: "ava@example.com vs rafi@example.com",
    status: "under_review",
    evidence: "Logs, failing CI, payment receipt",
    amount: "$850"
  }
];

export const auditTrail = [
  {
    id: "aud_1",
    admin: "root-admin",
    action: "suspend_user",
    detail: "Suspended usr_1002 for repeated spam reports",
    createdAt: "2026-05-19T09:42:00Z"
  },
  {
    id: "aud_2",
    admin: "root-admin",
    action: "reject_job",
    detail: "Rejected job_2001 due to low quality scope",
    createdAt: "2026-05-20T11:10:00Z"
  }
];
