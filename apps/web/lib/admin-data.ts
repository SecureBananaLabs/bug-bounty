import {
  adminMetrics as mockMetrics,
  adminUsers as mockUsers,
  auditTrail as mockAuditTrail,
  disputes as mockDisputes,
  moderationQueue as mockJobs
} from "./admin-mock";

export const ADMIN_PAGE_SIZE = 5;

export type AdminMetrics = {
  totalUsers: number;
  activeJobs: number;
  openDisputes: number;
  flaggedListings: number;
  revenue: number | string;
  trustScoreBuckets: Array<{ label: string; count: number }>;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
  activeJobs: number;
  disputes: number;
  profile: {
    headline: string;
    location: string;
    bio: string;
    trustScore: number;
  };
  activeJobTitles: string[];
  disputeHistory: string[];
  lastSeenAt: string;
};

export type AdminJob = {
  id: string;
  title: string;
  owner: string;
  status: string;
  reason: string | null;
  updatedAt: string;
};

export type AdminDispute = {
  id: string;
  title: string;
  parties: string;
  status: string;
  evidence: string;
  amount: string;
  updatedAt: string;
  thread: Array<{ author: string; body: string; at: string }>;
  transaction: { id: string; amount: string; currency: string; status: string };
  resolution?: string;
};

export type AdminAuditEntry = {
  id: string;
  admin: string;
  action: string;
  detail: string;
  createdAt: string;
};

export type AdminNotification = {
  id: string;
  recipient: string;
  type: string;
  detail: string;
  createdAt: string;
  status: string;
};

export type AdminSettings = {
  registrationsEnabled: boolean;
  jobPostingsEnabled: boolean;
};

export type TablePage<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminDashboardData = {
  source: "api" | "mock";
  metrics: AdminMetrics;
  users: TablePage<AdminUser>;
  jobs: TablePage<AdminJob>;
  disputes: TablePage<AdminDispute>;
  auditLog: TablePage<AdminAuditEntry>;
  notifications: TablePage<AdminNotification>;
  settings: AdminSettings;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type FetchOptions = {
  token: string | null;
};

const apiBaseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:4000";

function wrapPage<T>(items: T[]): TablePage<T> {
  return {
    items,
    page: 1,
    limit: items.length,
    total: items.length,
    totalPages: 1
  };
}

async function apiJson<T>(path: string, token: string | null): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    cache: "no-store",
    headers: token ? { authorization: `Bearer ${token}` } : undefined
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? `Request failed for ${path}`);
  }

  return payload.data;
}

export async function loadAdminDashboard({ token }: FetchOptions): Promise<AdminDashboardData> {
  try {
    const [metrics, users, jobs, disputes, auditLog, notifications, settings] = await Promise.all([
      apiJson<AdminMetrics>("/api/admin/metrics", token),
      apiJson<TablePage<AdminUser>>(`/api/admin/users?page=1&limit=${ADMIN_PAGE_SIZE}`, token),
      apiJson<TablePage<AdminJob>>(`/api/admin/jobs?page=1&limit=${ADMIN_PAGE_SIZE}`, token),
      apiJson<TablePage<AdminDispute>>(`/api/admin/disputes?page=1&limit=${ADMIN_PAGE_SIZE}`, token),
      apiJson<TablePage<AdminAuditEntry>>(`/api/admin/audit-log?page=1&limit=${ADMIN_PAGE_SIZE}`, token),
      apiJson<TablePage<AdminNotification>>(`/api/admin/notifications?page=1&limit=${ADMIN_PAGE_SIZE}`, token),
      apiJson<AdminSettings>("/api/admin/settings", token)
    ]);

    return {
      source: "api",
      metrics,
      users,
      jobs,
      disputes,
      auditLog,
      notifications,
      settings
    };
  } catch {
    return {
      source: "mock",
      metrics: mockMetrics,
      users: wrapPage(mockUsers as AdminUser[]),
      jobs: wrapPage(mockJobs as AdminJob[]),
      disputes: wrapPage(mockDisputes as AdminDispute[]),
      auditLog: wrapPage(mockAuditTrail as AdminAuditEntry[]),
      notifications: wrapPage([
        {
          id: "ntf_1",
          recipient: "Ava Chen",
          type: "job_flagged",
          detail: "Your listing was flagged for moderation review.",
          createdAt: "2026-05-20T09:00:00Z",
          status: "unread"
        }
      ]),
      settings: {
        registrationsEnabled: true,
        jobPostingsEnabled: true
      }
    };
  }
}
