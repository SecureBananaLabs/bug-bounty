export type AdminUser = {
  id: string;
  name: string;
  role: "freelancer" | "client";
  status: "active" | "suspended" | "banned";
  joinedAt: string;
  trustScore: number;
  headline: string;
  activeJobs: string[];
  disputes: string[];
};

export type FlaggedListing = {
  id: string;
  title: string;
  poster: string;
  status: "flagged" | "approved" | "rejected" | "escalated";
  budgetCents: number;
  flagReason: string;
  reports: string[];
};

export type Dispute = {
  id: string;
  freelancer: string;
  client: string;
  jobTitle: string;
  status: "open" | "under_review" | "resolved";
  amountCents: number;
  thread: string[];
  evidence: string[];
  transaction: string;
  ruling?: string;
};

export type PlatformControl = {
  key: "registrations" | "jobPostings";
  label: string;
  enabled: boolean;
  updatedAt: string;
  updatedBy: string;
};

export type AuditEntry = {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  createdAt: string;
};

export type AdminSnapshot = {
  metrics: {
    totalUsers: number;
    activeJobs: number;
    openDisputes: number;
    flaggedListings: number;
    revenueCurrentPeriod: number;
    trustScoreDistribution: { range: string; count: number }[];
  };
  users: AdminUser[];
  flaggedListings: FlaggedListing[];
  disputes: Dispute[];
  controls: PlatformControl[];
  auditLog: AuditEntry[];
};

export function getAdminSnapshot(): AdminSnapshot {
  return {
    metrics: {
      totalUsers: 5,
      activeJobs: 1,
      openDisputes: 2,
      flaggedListings: 2,
      revenueCurrentPeriod: 128900,
      trustScoreDistribution: [
        { range: "0-39", count: 1 },
        { range: "40-69", count: 1 },
        { range: "70-89", count: 2 },
        { range: "90-100", count: 1 }
      ]
    },
    users: [
      {
        id: "usr_101",
        name: "Maya Stone",
        role: "freelancer",
        status: "active",
        joinedAt: "2026-01-14",
        trustScore: 94,
        headline: "Full-stack marketplace engineer",
        activeJobs: ["Build escrow release workflow"],
        disputes: ["dsp_901"]
      },
      {
        id: "usr_102",
        name: "Jordan Reed",
        role: "client",
        status: "active",
        joinedAt: "2026-02-05",
        trustScore: 82,
        headline: "Operations lead",
        activeJobs: ["Build escrow release workflow"],
        disputes: []
      },
      {
        id: "usr_103",
        name: "Priya Shah",
        role: "freelancer",
        status: "suspended",
        joinedAt: "2026-02-22",
        trustScore: 57,
        headline: "Data automation specialist",
        activeJobs: [],
        disputes: ["dsp_902"]
      },
      {
        id: "usr_104",
        name: "Owen Lee",
        role: "client",
        status: "active",
        joinedAt: "2026-03-03",
        trustScore: 76,
        headline: "Product founder",
        activeJobs: ["Landing page refresh"],
        disputes: ["dsp_902"]
      },
      {
        id: "usr_105",
        name: "Sam Rivera",
        role: "freelancer",
        status: "banned",
        joinedAt: "2026-03-19",
        trustScore: 21,
        headline: "Growth copywriter",
        activeJobs: [],
        disputes: []
      }
    ],
    flaggedListings: [
      {
        id: "job_402",
        title: "Scrape private contact database",
        poster: "Jordan Reed",
        status: "flagged",
        budgetCents: 90000,
        flagReason: "Automated policy rule: prohibited data source",
        reports: ["Contains private contact data request", "Possible ToS violation"]
      },
      {
        id: "job_403",
        title: "Landing page refresh",
        poster: "Owen Lee",
        status: "flagged",
        budgetCents: 140000,
        flagReason: "User report: misleading payment terms",
        reports: ["Milestone terms conflict with platform escrow policy"]
      }
    ],
    disputes: [
      {
        id: "dsp_901",
        freelancer: "Maya Stone",
        client: "Jordan Reed",
        jobTitle: "Build escrow release workflow",
        status: "open",
        amountCents: 120000,
        thread: ["Client: Deliverable missed webhook retries.", "Freelancer: Retries are implemented; logs attached."],
        evidence: ["deploy-log.txt", "webhook-test-result.png"],
        transaction: "txn_501 escrow held"
      },
      {
        id: "dsp_902",
        freelancer: "Priya Shah",
        client: "Owen Lee",
        jobTitle: "Landing page refresh",
        status: "under_review",
        amountCents: 65000,
        thread: ["Freelancer: Scope changed after approval.", "Client: Final asset missed agreed copy."],
        evidence: ["milestone-approval.pdf", "final-copy.md"],
        transaction: "txn_502 escrow held"
      }
    ],
    controls: [
      {
        key: "registrations",
        label: "New user registrations",
        enabled: true,
        updatedAt: "2026-05-20T14:15:00.000Z",
        updatedBy: "system"
      },
      {
        key: "jobPostings",
        label: "New job postings",
        enabled: true,
        updatedAt: "2026-05-20T14:15:00.000Z",
        updatedBy: "system"
      }
    ],
    auditLog: [
      {
        id: "aud_001",
        adminId: "system",
        action: "platform.review_started",
        targetType: "platform",
        targetId: "admin",
        reason: "Initial admin queue loaded",
        createdAt: "2026-05-20T14:15:00.000Z"
      }
    ]
  };
}
