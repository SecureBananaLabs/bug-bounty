export const API_URL = "http://localhost:4000/api";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  headers.set('Content-Type', 'application/json');

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'API Request Failed');
  }

  return data.data; // Our backend wraps success responses in { success: true, data: ... }
}

export async function loginAsAdmin() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@freelanceflow.com', password: 'password' })
  });
  const data = await res.json();
  if (data.success && data.data?.token) {
    localStorage.setItem('token', data.data.token);
    return true;
  }
  return false;
}

export function logout() {
  localStorage.removeItem('token');
}
