type AdminFilters = {
  q?: string;
  role?: string;
  status?: string;
  joinedAfter?: string;
  page?: string;
  pageSize?: string;
};

type AdminApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export function getAdminApiBaseUrl() {
  return process.env.ADMIN_API_BASE_URL ?? process.env.API_BASE_URL ?? "http://127.0.0.1:4000";
}

function toQueryString(filters: AdminFilters) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

async function fetchAdminResource<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${getAdminApiBaseUrl()}${path}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const payload = (await response.json()) as AdminApiResponse<T>;

  if (!response.ok) {
    const error = new Error(payload.message ?? `Request failed with ${response.status}`);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return payload.data;
}

export async function loadAdminDashboard(token: string, filters: AdminFilters) {
  const userQuery = toQueryString({
    ...filters,
    page: filters.page ?? "1",
    pageSize: filters.pageSize ?? "5"
  });
  const queueQuery = toQueryString({
    q: filters.q,
    page: filters.page ?? "1",
    pageSize: filters.pageSize ?? "5"
  });

  const [overview, users, jobs, disputes, controls, auditLog] = await Promise.all([
    fetchAdminResource<Record<string, unknown>>(`/api/admin/overview${queueQuery}`, token),
    fetchAdminResource<Record<string, unknown>>(`/api/admin/users${userQuery}`, token),
    fetchAdminResource<Record<string, unknown>>(`/api/admin/jobs${queueQuery}`, token),
    fetchAdminResource<Record<string, unknown>>(`/api/admin/disputes${queueQuery}`, token),
    fetchAdminResource<Record<string, unknown>>("/api/admin/controls", token),
    fetchAdminResource<Record<string, unknown>>(`/api/admin/audit-log${queueQuery}`, token)
  ]);

  return {
    overview,
    users,
    jobs,
    disputes,
    controls,
    auditLog
  };
}

export function readAdminToken() {
  return "";
}
