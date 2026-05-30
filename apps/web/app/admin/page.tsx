"use client";
import { useEffect, useState } from "react";
import Dashboard from "./components/Dashboard";
import UsersList from "./components/UsersList";
import ModerationQueue from "./components/ModerationQueue";
import DisputeQueue from "./components/DisputeQueue";
import Controls from "./components/Controls";
import AuditLog from "./components/AuditLog";
import { apiFetch } from "./utils";

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const verifyAdmin = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      await apiFetch("/api/admin/metrics");
      setIsAuthenticated(true);
    } catch (err: any) {
      setAuthError("Session expired or unauthorized admin access.");
      setIsAuthenticated(false);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyAdmin();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAuthError(null);
    try {
      const response = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || "Failed to authenticate.");
      }

      localStorage.setItem("token", body.data.token);
      
      // Perform server-side role validation
      await apiFetch("/api/admin/metrics");
      setIsAuthenticated(true);
    } catch (err: any) {
      setAuthError(err.message || "Invalid admin credentials.");
      localStorage.removeItem("token");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: '15px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: '#666', fontFamily: 'system-ui' }}>Verifying system admin access...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div style={{ 
        maxWidth: '450px', 
        margin: '60px auto', 
        padding: '35px', 
        background: '#ffffff', 
        borderRadius: '16px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.02)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '60px', 
            height: '60px', 
            background: '#fee2e2', 
            borderRadius: '50%', 
            marginBottom: '15px' 
          }}>
            <svg style={{ width: '30px', height: '30px', color: '#dc2626' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m-3-7h10a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8a2 2 0 012-2zM9 9V7a3 3 0 116 0v2" />
            </svg>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' }}>Admin Gateway</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Enforced role-based authentication guard</p>
        </div>

        {authError && (
          <div style={{ 
            background: '#fef2f2', 
            borderLeft: '4px solid #ef4444', 
            color: '#991b1b', 
            padding: '12px 16px', 
            borderRadius: '6px', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {authError}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label htmlFor="admin-email" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>System Admin Email</label>
            <input 
              id="admin-email"
              type="email" 
              placeholder="e.g. admin@freelanceflow.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #d1d5db', 
                borderRadius: '8px', 
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          <div>
            <label htmlFor="admin-password" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Password</label>
            <input 
              id="admin-password"
              type="password" 
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #d1d5db', 
                borderRadius: '8px', 
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            style={{ 
              background: '#2563eb', 
              color: '#ffffff', 
              fontWeight: '600', 
              padding: '12px', 
              borderRadius: '8px', 
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer', 
              fontSize: '14px',
              marginTop: '10px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
            onMouseOut={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = '#2563eb'; }}
          >
            {submitting ? 'Authenticating...' : 'Secure Authorization'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', borderTop: '1px solid #f3f4f6', paddingTop: '15px' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>Only authorized administrators are permitted beyond this gateway.</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <Dashboard />;
      case "users": return <UsersList />;
      case "moderation": return <ModerationQueue />;
      case "disputes": return <DisputeQueue />;
      case "controls": return <Controls />;
      case "audit": return <AuditLog />;
      default: return <Dashboard />;
    }
  };

  const navStyles = (tab: string) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    borderBottom: activeTab === tab ? '3px solid #3b82f6' : '3px solid transparent',
    fontWeight: activeTab === tab ? 'bold' : 'normal',
    color: activeTab === tab ? '#3b82f6' : '#555'
  });

  return (
    <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Admin Control Panel</h2>
      
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #ddd', marginBottom: '20px', overflowX: 'auto' }}>
        <div style={navStyles("dashboard")} onClick={() => setActiveTab("dashboard")}>Dashboard</div>
        <div style={navStyles("users")} onClick={() => setActiveTab("users")}>Users</div>
        <div style={navStyles("moderation")} onClick={() => setActiveTab("moderation")}>Moderation</div>
        <div style={navStyles("disputes")} onClick={() => setActiveTab("disputes")}>Disputes</div>
        <div style={navStyles("controls")} onClick={() => setActiveTab("controls")}>Controls</div>
        <div style={navStyles("audit")} onClick={() => setActiveTab("audit")}>Audit Log</div>
      </div>

      <div style={{ minHeight: '600px' }}>
        {renderContent()}
      </div>
    </section>
  );
}
