const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/admin";

async function request(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("adminToken") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>)
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text || res.statusText;
    try {
      const json = JSON.parse(text);
      message = json.message || message;
    } catch {
      // keep text
    }
    throw new Error(message || `Request failed with status ${res.status}`);
  }
  const payload = await res.json();
  return payload.data;
}

export const adminApi = {
  getMetrics: () => request("/metrics"),
  listUsers: (params: Record<string, string | number>) => {
    const query = new URLSearchParams();
    for (const key in params) {
      if (params[key] !== undefined && params[key] !== "") query.set(key, String(params[key]));
    }
    return request(`/users?${query.toString()}`);
  },
  getUser: (id: string) => request(`/users/${id}`),
  updateUserStatus: (id: string, body: { action: string; reason?: string }) =>
    request(`/users/${id}/status`, { method: "POST", body: JSON.stringify(body) }),
  listFlaggedJobs: (params: Record<string, string | number>) => {
    const query = new URLSearchParams();
    for (const key in params) {
      if (params[key] !== undefined && params[key] !== "") query.set(key, String(params[key]));
    }
    return request(`/jobs/flagged?${query.toString()}`);
  },
  moderateJob: (id: string, decision: string) =>
    request(`/jobs/${id}/moderate`, { method: "POST", body: JSON.stringify({ decision }) }),
  listDisputes: (params: Record<string, string | number>) => {
    const query = new URLSearchParams();
    for (const key in params) {
      if (params[key] !== undefined && params[key] !== "") query.set(key, String(params[key]));
    }
    return request(`/disputes?${query.toString()}`);
  },
  getDispute: (id: string) => request(`/disputes/${id}`),
  ruleDispute: (id: string, ruling: string) =>
    request(`/disputes/${id}/rule`, { method: "POST", body: JSON.stringify({ ruling }) }),
  getTrustDistribution: () => request("/trust/distribution"),
  getControls: () => request("/controls"),
  updateControl: (control: string, enabled: boolean) =>
    request("/controls", { method: "POST", body: JSON.stringify({ control, enabled }) }),
  listAuditLog: (params: Record<string, string | number>) => {
    const query = new URLSearchParams();
    for (const key in params) {
      if (params[key] !== undefined && params[key] !== "") query.set(key, String(params[key]));
    }
    return request(`/audit-log?${query.toString()}`);
  }
};
