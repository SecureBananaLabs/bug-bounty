export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // In a real app, this token would come from auth state or cookies
  // For the sake of the prompt's server-side verify, we simulate passing an admin token
  // Let's assume the user has a valid admin token in localStorage, or we mock it
  const token = localStorage.getItem('token') || 'mock-admin-token';
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const res = await fetch(`http://localhost:4000${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error('Forbidden: Admin access required');
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || 'API request failed');
  }

  return res.json();
}
