// Frontend API client for the admin panel.
//
// Security note: the admin panel is protected by an admin-only route guard. The
// server-side middleware (adminAuth) is the AUTHORITATIVE check — it re-verifies
// the JWT on EVERY request and enforces role === "ADMIN". The client-side guard
// below is a UX convenience (redirect non-admins) but is NEVER trusted as a
// security boundary; every API call carries the bearer token that the server
// independently validates.

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

export function clearAdminToken() {
  if (typeof window !== "undefined") localStorage.removeItem("admin_token");
}

export function setAdminToken(token: string) {
  if (typeof window !== "undefined") localStorage.setItem("admin_token", token);
}

/** Read the admin profile embedded in the JWT payload (client-only convenience). */
export function getAdminFromToken(): { sub: string; role: string } | null {
  if (typeof window === "undefined") return null;
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { sub: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/** Build a query string, dropping undefined / null values. */
function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) sp.set(k, String(v));
  }
  return sp.size ? `?${sp.toString()}` : "";
}

/** Central request helper for admin API routes. Throws ApiError on failure. */
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/admin${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const body: ApiResponse<T> = await res.json().catch(() => ({
    success: false,
    data: null as unknown as T,
    message: res.statusText,
  }));

  if (!res.ok || !body.success) {
    throw new ApiError(res.status, body.message ?? "Request failed");
  }
  return body.data;
}

/** Auth login lives at /api/auth/login (outside the admin prefix). */
export async function login(email: string, password: string): Promise<{ token: string; role: string }> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({ success: false, message: res.statusText }));
  if (!res.ok || !body.success) {
    throw new ApiError(res.status, body.message ?? "Login failed");
  }
  const data = body.data as { token: string; role: string };
  setAdminToken(data.token);
  return data;
}

export interface AdminMetrics {
  totalUsers: number;
  activeJobs: number;
  openDisputes: number;
  flaggedListings: number;
  monthlyVolume: number;
  trustScoreDistribution: Record<string, number>;
}

export interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  trustScore: number;
  joinedAt: string;
  activeJobs: number;
  disputes: number;
}

export interface UserProfile extends UserRecord {
  disputeHistory: DisputeRecord[];
}

export interface JobRecord {
  id: string;
  title: string;
  status: string;
  clientId: string;
  postedAt: string;
  flagged: boolean;
  flagReason?: string | null;
}

export interface DisputeRecord {
  id: string;
  jobId: string;
  freelancerId: string;
  clientId: string;
  status: "open" | "under_review" | "resolved" | "escalated";
  amount: number;
  createdAt: string;
  thread: { authorId: string; body: string; createdAt: string }[];
  evidence: { type: string; url: string; label: string }[];
  resolution?: { inFavorOf: string; refund: boolean; reason?: string; resolvedAt: string };
}

export interface PlatformControls {
  registrationsEnabled: boolean;
  jobPostingsEnabled: boolean;
}

export interface AuditEntry {
  id: string;
  adminId: string;
  action: string;
  target: string | null;
  meta: Record<string, unknown>;
  createdAt: string;
}

export const api = {
  metrics: () => apiRequest<AdminMetrics>("/metrics"),
  users: (params: Record<string, string | number>) =>
    apiRequest<PaginatedResult<UserRecord>>(`/users${buildQuery(params)}`),
  userProfile: (userId: string) => apiRequest<UserProfile>(`/users/${userId}/profile`),
  setUserStatus: (userId: string, action: "suspend" | "reinstate" | "ban", reason?: string) =>
    apiRequest<UserRecord>(`/users/${userId}/${action}`, {
      method: "PATCH",
      body: JSON.stringify(reason ? { reason } : {}),
    }),
  flaggedJobs: (params: Record<string, string | number>) =>
    apiRequest<PaginatedResult<JobRecord>>(`/jobs/flagged${buildQuery(params)}`),
  moderationJob: (jobId: string) => apiRequest<JobRecord>(`/jobs/${jobId}`),
  moderateJob: (jobId: string, decision: "approve" | "reject" | "escalate", reason?: string) =>
    apiRequest<JobRecord>(`/jobs/${jobId}/${decision}`, {
      method: "PATCH",
      body: JSON.stringify(reason ? { reason } : {}),
    }),
  disputes: (params: Record<string, string | number>) =>
    apiRequest<PaginatedResult<DisputeRecord>>(`/disputes${buildQuery(params)}`),
  dispute: (id: string) => apiRequest<DisputeRecord>(`/disputes/${id}`),
  resolveDispute: (id: string, ruling: "freelancer" | "client" | "escalate", options?: { refund?: boolean; reason?: string }) =>
    apiRequest<DisputeRecord>(`/disputes/${id}/resolve/${ruling}`, {
      method: "PATCH",
      body: JSON.stringify(options ?? {}),
    }),
  controls: () => apiRequest<PlatformControls>("/controls"),
  setControls: (controls: Partial<PlatformControls>) =>
    apiRequest<PlatformControls>("/controls", {
      method: "PATCH",
      body: JSON.stringify(controls),
    }),
  audit: (params: Record<string, string | number>) =>
    apiRequest<PaginatedResult<AuditEntry>>(`/audit${buildQuery(params)}`),
};
