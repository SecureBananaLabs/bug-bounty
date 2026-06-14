export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "client" | "freelancer";
  status: "active" | "suspended" | "banned";
  joinedAt: string;
  trustScore: number;
  activeJobs: number;
  disputeCount: number;
};

export type FlaggedListing = {
  id: string;
  title: string;
  ownerName: string;
  reason: string;
  status: "flagged" | "approved" | "rejected" | "escalated";
  riskLevel: "low" | "medium" | "high";
  flaggedAt: string;
};

export type Dispute = {
  id: string;
  jobTitle: string;
  clientName: string;
  freelancerName: string;
  amount: number;
  currency: string;
  status: "open" | "under_review" | "resolved" | "escalated";
  summary: string;
  evidenceCount: number;
};

export type AuditLogEntry = {
  id: string;
  adminId: string;
  actionType: string;
  targetType: string;
  targetId: string;
  detail: string;
  createdAt: string;
};

export type AdminDashboardData = {
  metrics: {
    totalUsers: number;
    activeJobs: number;
    openDisputes: number;
    flaggedListings: number;
    revenueCurrentPeriod: number;
  };
  trustDistribution: Array<{ label: string; count: number }>;
  users: AdminUser[];
  flaggedListings: FlaggedListing[];
  disputes: Dispute[];
  controls: {
    registrationsEnabled: boolean;
    jobPostingsEnabled: boolean;
  };
  auditLog: AuditLogEntry[];
};
