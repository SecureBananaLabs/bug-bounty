import type {
  AuditFilters,
  AuditLog,
  Control,
  Dispute,
  DisputeDetail,
  Listing,
  MetricState,
  Page,
  User,
  UserDetail,
  UserFilters,
  UserStatus
} from "./types";

type QueryValue = string | number | boolean | undefined;

function tokenFromBrowser() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("freelanceflow_admin_token");
}

export function hasAdminApiConfig() {
  return Boolean(process.env.NEXT_PUBLIC_API_BASE_URL && (process.env.NEXT_PUBLIC_ADMIN_TOKEN || tokenFromBrowser()));
}

function queryString(values: Record<string, QueryValue>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

async function request<T>(path: string, init: RequestInit = {}) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  const token = process.env.NEXT_PUBLIC_ADMIN_TOKEN || tokenFromBrowser();

  if (!apiBase || !token) {
    throw new Error("Admin API is not configured");
  }

  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      ...init.headers
    },
    cache: "no-store"
  });
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || `Admin API request failed: ${path}`);
  }

  return payload.data as T;
}

export function fetchMetrics() {
  return request<MetricState>("/api/admin/metrics");
}

export function fetchUsers(filters: UserFilters, page: number, pageSize: number) {
  return request<Page<User>>(
    `/api/admin/users${queryString({
      page,
      pageSize,
      search: filters.search,
      role: filters.role,
      status: filters.status,
      joinedFrom: filters.joinedFrom,
      joinedTo: filters.joinedTo
    })}`
  );
}

export function fetchUserDetail(id: string) {
  return request<UserDetail>(`/api/admin/users/${id}`);
}

export function patchUserStatus(id: string, status: UserStatus, reason: string) {
  return request<{ user: User; audit: AuditLog }>(`/api/admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, reason })
  });
}

export function fetchModeration(status: string, page: number, pageSize: number) {
  return request<Page<Listing>>(
    `/api/admin/moderation/jobs${queryString({
      page,
      pageSize,
      status
    })}`
  );
}

export function patchModeration(id: string, decision: "approve" | "reject" | "escalate", reason: string) {
  return request<{ listing: Listing; notification: unknown; audit: AuditLog }>(`/api/admin/moderation/jobs/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ decision, reason })
  });
}

export function fetchDisputes(status: string, page: number, pageSize: number) {
  return request<Page<Dispute>>(
    `/api/admin/disputes${queryString({
      page,
      pageSize,
      status
    })}`
  );
}

export function fetchDisputeDetail(id: string) {
  return request<DisputeDetail>(`/api/admin/disputes/${id}`);
}

export function patchDisputeRuling(
  id: string,
  ruling: "client" | "freelancer" | "escalate",
  notes: string,
  refund: boolean
) {
  return request<{ dispute: Dispute; notifications: unknown[]; audit: AuditLog }>(
    `/api/admin/disputes/${id}/ruling`,
    {
      method: "PATCH",
      body: JSON.stringify({ ruling, notes, refund })
    }
  );
}

export function fetchControls() {
  return request<Record<string, Control>>("/api/admin/platform-controls");
}

export function patchControl(key: string, enabled: boolean) {
  return request<{ control: Control; audit: AuditLog }>(`/api/admin/platform-controls/${key}`, {
    method: "PATCH",
    body: JSON.stringify({ enabled, confirm: true })
  });
}

export function fetchAuditLogs(filters: AuditFilters, page: number, pageSize: number) {
  return request<Page<AuditLog>>(
    `/api/admin/audit-logs${queryString({
      page,
      pageSize,
      actionType: filters.actionType,
      admin: filters.admin,
      from: filters.from,
      to: filters.to
    })}`
  );
}
