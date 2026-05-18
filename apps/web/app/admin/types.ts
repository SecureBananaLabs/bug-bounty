export type UserStatus = "active" | "suspended" | "banned";
export type UserRole = "client" | "freelancer";
export type ModerationStatus = "flagged" | "approved" | "rejected" | "escalated";
export type DisputeStatus = "open" | "under_review" | "resolved" | "escalated";

export type Pagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type Page<T> = {
  items: T[];
  pagination: Pagination;
};

export type MetricState = {
  totalUsers: number;
  activeJobs: number;
  openDisputes: number;
  flaggedListings: number;
  revenueCurrentPeriod: number;
  trustScoreDistribution: Array<{ label: string; count: number }>;
};

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  trustScore: number;
  location: string;
};

export type Listing = {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  status?: string;
  budget: number;
  moderationStatus: ModerationStatus;
  flagReason: string;
  reports: number;
  automatedFlags?: string[];
  createdAt?: string;
  flaggedAt: string;
};

export type Dispute = {
  id: string;
  jobId?: string;
  jobTitle: string;
  clientId?: string;
  clientName: string;
  freelancerId?: string;
  freelancerName: string;
  status: DisputeStatus;
  openedAt: string;
  summary: string;
  transaction: TransactionSummary;
  ruling: string | null;
  refundTriggered: boolean;
};

export type TransactionSummary = {
  id?: string;
  amount: number;
  currency: string;
  escrowStatus: string;
};

export type UserDetail = {
  profile: User;
  activeJobs: Listing[];
  disputeHistory: Dispute[];
};

export type DisputeDetail = Dispute & {
  thread: Array<{ authorId: string; body: string; createdAt: string }>;
  evidence: Array<{ id: string; label: string; type: string }>;
  transaction: TransactionSummary;
};

export type Control = {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  updatedAt: string;
  updatedBy: string;
};

export type AuditLog = {
  id: string;
  adminId: string;
  actionType: string;
  targetType: string;
  targetId: string;
  summary: string;
  createdAt: string;
};

export type UserFilters = {
  search: string;
  role: "all" | UserRole;
  status: "all" | UserStatus;
  joinedFrom: string;
  joinedTo: string;
};

export type AuditFilters = {
  actionType: string;
  admin: string;
  from: string;
  to: string;
};
