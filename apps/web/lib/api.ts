export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function apiGet<T>(path: string): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    if (res.status === 403) throw new Error("Forbidden: Admin access required");
    if (res.status === 401) throw new Error("Unauthorized");
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `API error: ${res.status}`);
  }
  const json = await res.json();
  return json.data as T;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    if (res.status === 403) throw new Error("Forbidden: Admin access required");
    if (res.status === 401) throw new Error("Unauthorized");
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `API error: ${res.status}`);
  }
  const json = await res.json();
  return json.data as T;
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    if (res.status === 403) throw new Error("Forbidden: Admin access required");
    if (res.status === 401) throw new Error("Unauthorized");
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || `API error: ${res.status}`);
  }
  const json = await res.json();
  return json.data as T;
}
