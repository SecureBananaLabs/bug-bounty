"use client";

import { useEffect, useState } from "react";
import { fetchApi, loginAsAdmin } from "../lib/api";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Test the token by fetching admin metrics
      await fetchApi("/admin/metrics");
      setIsAuthorized(true);
    } catch (err: any) {
      setIsAuthorized(false);
      setError(err.message);
    }
  };

  const handleLogin = async () => {
    const success = await loginAsAdmin();
    if (success) {
      checkAuth();
    } else {
      setError("Login failed.");
    }
  };

  if (isAuthorized === null) {
    return <div className="card">Loading admin module...</div>;
  }

  if (!isAuthorized) {
    return (
      <div className="card" style={{ borderLeft: "4px solid #e74c3c" }}>
        <h3>Access Denied</h3>
        <p>{error || "You must be an admin to view this page."}</p>
        <button 
          onClick={handleLogin}
          style={{ marginTop: 10, padding: "8px 16px", background: "#333", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
        >
          Login as Admin
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
