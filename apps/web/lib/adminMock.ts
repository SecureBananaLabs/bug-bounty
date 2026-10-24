export type UserRole = "client" | "freelancer" | "admin";
export type UserStatus = "active" | "suspended" | "banned";
export type FlagStatus = "pending" | "approved" | "rejected" | "escalated";
export type DisputeStatus = "open" | "under_review" | "resolved";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  trustScore: number;
  activeJobs: number;
  disputes: number;
};

export type FlaggedJob = {
  id: string;
  jobId: string;
  title: string;
  client: string;
  reason: string;
  severity: "low" | "medium" | "high";
  status: FlagStatus;
  flaggedAt: string;
};

export type AdminDispute = {
  id: string;
  client: string;
  freelancer: string;
  jobTitle: string;
  amount: number;
  status: DisputeStatus;
  evidenceCount: number;
  transactionId: string;
  updatedAt: string;
  thread: string[];
  ruling: string | null;
};

export type PlatformControl = {
  id: "registrations" | "jobPostings";
  label: string;
  enabled: boolean;
  updatedBy: string;
  updatedAt: string;
};

export type AuditEntry = {
  id: string;
  adminId: string;
  action: string;
  target: string;
  details: string;
  createdAt: string;
};

export type AdminPanelData = {
  session: {
    id: string;
    name: string;
    role: UserRole;
  };
  users: AdminUser[];
  flaggedJobs: FlaggedJob[];
  disputes: AdminDispute[];
  controls: PlatformControl[];
  auditLog: AuditEntry[];
};

export const adminPanelData: AdminPanelData = {
  session: {
    id: "admin_demo",
    name: "Operations Admin",
    role: "admin"
  },
  users: [
    {
      id: "usr_1001",
      name: "Maya Chen",
      email: "maya@example.com",
      role: "freelancer",
      status: "active",
      joinedAt: "2026-02-14",
      trustScore: 96,
      activeJobs: 4,
      disputes: 0
    },
    {
      id: "usr_1002",
      name: "Jordan Lee",
      email: "jordan@example.com",
      role: "client",
      status: "active",
      joinedAt: "2026-03-02",
      trustScore: 89,
      activeJobs: 2,
      disputes: 1
    },
    {
      id: "usr_1003",
      name: "Riley Stone",
      email: "riley@example.com",
      role: "freelancer",
      status: "suspended",
      joinedAt: "2026-04-11",
      trustScore: 54,
      activeJobs: 1,
      disputes: 2
    },
    {
      id: "usr_1004",
      name: "Avery Patel",
      email: "avery@example.com",
      role: "client",
      status: "banned",
      joinedAt: "2026-01-20",
      trustScore: 18,
      activeJobs: 0,
      disputes: 4
    }
  ],
  flaggedJobs: [
    {
      id: "flag_2001",
      jobId: "job_3001",
      title: "Scrape competitor customer data",
      client: "Avery Patel",
      reason: "Potential policy violation",
      severity: "high",
      status: "pending",
      flaggedAt: "2026-05-27T14:21:00.000Z"
    },
    {
      id: "flag_2002",
      jobId: "job_3002",
      title: "Rebuild checkout analytics dashboard",
      client: "Jordan Lee",
      reason: "Budget anomaly",
      severity: "medium",
      status: "pending",
      flaggedAt: "2026-05-28T09:05:00.000Z"
    },
    {
      id: "flag_2003",
      jobId: "job_3003",
      title: "Write landing page copy",
      client: "Nora Kim",
      reason: "Repeated report from freelancers",
      severity: "low",
      status: "escalated",
      flaggedAt: "2026-05-29T16:44:00.000Z"
    }
  ],
  disputes: [
    {
      id: "dsp_4001",
      client: "Jordan Lee",
      freelancer: "Maya Chen",
      jobTitle: "API billing integration",
      amount: 2400,
      status: "open",
      evidenceCount: 5,
      transactionId: "pi_928391",
      updatedAt: "2026-05-29T20:12:00.000Z",
      thread: [
        "Client says milestone 2 is incomplete.",
        "Freelancer uploaded delivery notes and test evidence.",
        "Escrow payment is currently held."
      ],
      ruling: null
    },
    {
      id: "dsp_4002",
      client: "Nora Kim",
      freelancer: "Riley Stone",
      jobTitle: "Brand refresh deck",
      amount: 850,
      status: "under_review",
      evidenceCount: 3,
      transactionId: "pi_928407",
      updatedAt: "2026-05-28T11:33:00.000Z",
      thread: ["Freelancer missed the revision window.", "Client uploaded the original scope document."],
      ruling: null
    }
  ],
  controls: [
    {
      id: "registrations",
      label: "New user registrations",
      enabled: true,
      updatedBy: "admin_demo",
      updatedAt: "2026-05-29T19:15:00.000Z"
    },
    {
      id: "jobPostings",
      label: "New job postings",
      enabled: true,
      updatedBy: "admin_demo",
      updatedAt: "2026-05-29T19:15:00.000Z"
    }
  ],
  auditLog: [
    {
      id: "aud_5001",
      adminId: "admin_demo",
      action: "user.suspend",
      target: "usr_1003",
      details: "Suspended while dispute evidence is reviewed.",
      createdAt: "2026-05-29T18:41:00.000Z"
    },
    {
      id: "aud_5002",
      adminId: "admin_demo",
      action: "job.escalate",
      target: "flag_2003",
      details: "Escalated repeated report to senior moderation.",
      createdAt: "2026-05-29T19:02:00.000Z"
    }
  ]
};
