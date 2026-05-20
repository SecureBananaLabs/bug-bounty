const platformControls = {
  registrationsEnabled: true,
  jobPostingsEnabled: true
};

const auditLog = [
  {
    id: "audit-1042",
    adminId: "admin-2",
    action: "listing.rejected",
    target: "job-318",
    reason: "Duplicate crypto-wallet recovery posting",
    createdAt: "2026-05-20T18:42:00.000Z"
  },
  {
    id: "audit-1041",
    adminId: "admin-1",
    action: "user.suspended",
    target: "user-77",
    reason: "Chargeback risk review",
    createdAt: "2026-05-20T16:10:00.000Z"
  }
];

export async function getAdminMetrics() {
  return getAdminOverview().metrics;
}

export function getAdminOverview() {
  return {
    metrics: {
      totalUsers: 287,
      activeJobs: 42,
      openDisputes: 6,
      flaggedListings: 9,
      monthlyVolume: 128900
    },
    trustDistribution: [
      { band: "90-100", count: 84 },
      { band: "75-89", count: 132 },
      { band: "50-74", count: 56 },
      { band: "under 50", count: 15 }
    ],
    users: [
      {
        id: "user-41",
        name: "Maya Chen",
        role: "freelancer",
        status: "active",
        trustScore: 96,
        joinedAt: "2026-02-14",
        activeJobs: 4,
        disputes: 0
      },
      {
        id: "user-77",
        name: "Northstar Growth",
        role: "client",
        status: "suspended",
        trustScore: 48,
        joinedAt: "2026-04-03",
        activeJobs: 1,
        disputes: 2
      },
      {
        id: "user-93",
        name: "Jordan Park",
        role: "freelancer",
        status: "review",
        trustScore: 71,
        joinedAt: "2026-03-19",
        activeJobs: 2,
        disputes: 1
      }
    ],
    flaggedListings: [
      {
        id: "job-318",
        title: "Recover a locked wallet seed phrase",
        reporter: "auto-rule",
        severity: "high",
        status: "rejected",
        reason: "Credential recovery language"
      },
      {
        id: "job-322",
        title: "Scrape private community member list",
        reporter: "user-report",
        severity: "medium",
        status: "escalated",
        reason: "Potential privacy violation"
      }
    ],
    disputes: [
      {
        id: "disp-204",
        client: "Northstar Growth",
        freelancer: "Jordan Park",
        status: "under_review",
        amount: 1800,
        openedAt: "2026-05-18",
        nextStep: "Review delivery evidence"
      },
      {
        id: "disp-209",
        client: "Beacon Labs",
        freelancer: "Maya Chen",
        status: "open",
        amount: 640,
        openedAt: "2026-05-20",
        nextStep: "Await client response"
      }
    ],
    platformControls: { ...platformControls },
    auditLog
  };
}

export function updatePlatformControls(adminId, changes) {
  if (typeof changes.registrationsEnabled === "boolean") {
    platformControls.registrationsEnabled = changes.registrationsEnabled;
    auditLog.unshift({
      id: `audit-${Date.now()}`,
      adminId,
      action: changes.registrationsEnabled
        ? "platform.registrations_enabled"
        : "platform.registrations_paused",
      target: "registrations",
      reason: changes.reason ?? "No reason provided",
      createdAt: new Date().toISOString()
    });
  }

  if (typeof changes.jobPostingsEnabled === "boolean") {
    platformControls.jobPostingsEnabled = changes.jobPostingsEnabled;
    auditLog.unshift({
      id: `audit-${Date.now()}-jobs`,
      adminId,
      action: changes.jobPostingsEnabled
        ? "platform.job_postings_enabled"
        : "platform.job_postings_paused",
      target: "job-postings",
      reason: changes.reason ?? "No reason provided",
      createdAt: new Date().toISOString()
    });
  }

  return {
    platformControls: { ...platformControls },
    auditLog
  };
}
