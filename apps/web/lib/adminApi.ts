const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  });
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || `Request failed: ${res.status}`);
  }
  return json.data;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  isVerified: boolean;
  createdAt: string;
  _count?: { postedJobs: number; proposals: number; reviewsGot: number };
}

export interface FlaggedJob {
  id: string;
  title: string;
  status: string;
  flagReason: string | null;
  isFlagged: boolean;
  createdAt: string;
  updatedAt: string;
  client: { id: string; email: string; fullName: string };
  _count?: { proposals: number };
}

export interface Dispute {
  id: string;
  status: string;
  ruling: string | null;
  createdAt: string;
  updatedAt: string;
  job: { id: string; title: string; budgetMax: number };
  freelancerId: string;
  clientId: string;
}

export interface AuditLog {
  id: string;
  action: string;
  targetId: string;
  targetType: string;
  details: string | null;
  createdAt: string;
  admin: { id: string; email: string; fullName: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

function paginated<T>(path: string, params: Record<string, string | number> = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined))
  ).toString();
  return request<PaginatedResponse<T>>(`${path}?${qs}`);
}

export const adminApi = {
  getMetrics: () => request<Record<string, unknown>>("/admin/metrics"),

  getUsers: (params: { page?: number; role?: string; status?: string; search?: string }) =>
    paginated<User>("/admin/users", params),

  getUserDetails: (userId: string) =>
    request<Record<string, unknown>>(`/admin/users/${userId}`),

  updateUserStatus: (userId: string, status: string) =>
    request<User>(`/admin/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getFlaggedJobs: (params: { page?: number; status?: string }) =>
    paginated<FlaggedJob>("/admin/jobs/flagged", params),

  updateJobFlag: (jobId: string, action: string, reason?: string) =>
    request<Record<string, unknown>>(`/admin/jobs/${jobId}/flag`, {
      method: "PATCH",
      body: JSON.stringify({ action, reason }),
    }),

  getDisputes: (params: { page?: number; status?: string }) =>
    paginated<Dispute>("/admin/disputes", params),

  getDisputeDetails: (disputeId: string) =>
    request<Record<string, unknown>>(`/admin/disputes/${disputeId}`),

  resolveDispute: (
    disputeId: string,
    action: string,
    ruling?: string,
    reason?: string
  ) =>
    request<Record<string, unknown>>(`/admin/disputes/${disputeId}`, {
      method: "PATCH",
      body: JSON.stringify({ action, ruling, reason }),
    }),

  getAuditLogs: (params: {
    page?: number;
    adminId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }) => paginated<AuditLog>("/admin/audit-logs", params),

  getSettings: () =>
    request<Record<string, boolean>>("/admin/settings"),

  updateSetting: (key: string, value: boolean) =>
    request<Record<string, unknown>>("/admin/settings", {
      method: "PATCH",
      body: JSON.stringify({ key, value }),
    }),
};
