"use client";

import { useEffect, useState } from "react";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAuthorized(false);
      return;
    }
    // The API will enforce admin role; this is a client-side hint
    setAuthorized(true);
  }, []);

  if (authorized === null) {
    return (
      <section className="card">
        <h2>Admin Panel</h2>
        <p>Verifying access...</p>
      </section>
    );
  }

  if (!authorized) {
    return (
      <section className="card">
        <h2>Admin Panel</h2>
        <p className="error">Access denied. Please log in as an admin.</p>
      </section>
    );
  }

  return <>{children}</>;
}
