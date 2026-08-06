"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [profileVisibility, setProfileVisibility] = useState("Public");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState("Bank Transfer");

  const [email, setEmail] = useState("user@example.com");
  const [username, setUsername] = useState("freelancer_dev");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <section className="card">
        <h2>Settings Overview</h2>
        <p>Manage your account preferences, profile visibility, notification options, and security controls.</p>
      </section>

      <div className="grid">
        {/* Account / Profile Card */}
        <section className="card">
          <h3>Account & Profile</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginTop: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "#8a9fc4", marginBottom: "0.3rem" }}>Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #2a3765", background: "#0b1020", color: "#f2f5ff" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "#8a9fc4", marginBottom: "0.3rem" }}>Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #2a3765", background: "#0b1020", color: "#f2f5ff" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
              <span style={{ fontSize: "0.9rem" }}>Profile Visibility</span>
              <button 
                onClick={() => setProfileVisibility(profileVisibility === "Public" ? "Private" : "Public")}
                style={{ padding: "0.4rem 0.8rem", borderRadius: "6px", border: "none", cursor: "pointer", background: profileVisibility === "Public" ? "#10b981" : "#ef4444", color: "#fff", fontSize: "0.8rem", fontWeight: "bold" }}
              >
                {profileVisibility}
              </button>
            </div>
          </div>
        </section>

        {/* Notifications Card */}
        <section className="card">
          <h3>Notifications</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ display: "block", fontSize: "0.9rem" }}>Email Notifications</span>
                <span style={{ fontSize: "0.75rem", color: "#8a9fc4" }}>Get updates on jobs and messages</span>
              </div>
              <button 
                onClick={() => setEmailNotifications(!emailNotifications)}
                style={{ padding: "0.4rem 0.8rem", borderRadius: "6px", border: "none", cursor: "pointer", background: emailNotifications ? "#3b82f6" : "#4b5563", color: "#fff", fontSize: "0.8rem" }}
              >
                {emailNotifications ? "Enabled" : "Disabled"}
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ display: "block", fontSize: "0.9rem" }}>Push Notifications</span>
                <span style={{ fontSize: "0.75rem", color: "#8a9fc4" }}>Get real-time browser alerts</span>
              </div>
              <button 
                onClick={() => setPushNotifications(!pushNotifications)}
                style={{ padding: "0.4rem 0.8rem", borderRadius: "6px", border: "none", cursor: "pointer", background: pushNotifications ? "#3b82f6" : "#4b5563", color: "#fff", fontSize: "0.8rem" }}
              >
                {pushNotifications ? "Enabled" : "Disabled"}
              </button>
            </div>
          </div>
        </section>

        {/* Security Controls Card */}
        <section className="card">
          <h3>Security</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ display: "block", fontSize: "0.9rem" }}>Two-Factor Auth (2FA)</span>
                <span style={{ fontSize: "0.75rem", color: "#8a9fc4" }}>Secure your account access</span>
              </div>
              <button 
                onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                style={{ padding: "0.4rem 0.8rem", borderRadius: "6px", border: "none", cursor: "pointer", background: twoFactorAuth ? "#10b981" : "#ef4444", color: "#fff", fontSize: "0.8rem" }}
              >
                {twoFactorAuth ? "Active" : "Inactive"}
              </button>
            </div>
            <div>
              <button style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #3b82f6", background: "transparent", color: "#3b82f6", cursor: "pointer", fontSize: "0.85rem", transition: "0.2s" }}>
                Reset Password
              </button>
            </div>
          </div>
        </section>

        {/* Billing & Payout preferences */}
        <section className="card">
          <h3>Payout & Billing</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginTop: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "#8a9fc4", marginBottom: "0.3rem" }}>Preferred Payout Method</label>
              <select 
                value={payoutMethod} 
                onChange={(e) => setPayoutMethod(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #2a3765", background: "#0b1020", color: "#f2f5ff" }}
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="PayPal">PayPal</option>
                <option value="Stripe">Stripe</option>
                <option value="Crypto (USDC)">Crypto (USDC)</option>
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem", color: "#8a9fc4" }}>Payout Status</span>
              <span style={{ fontSize: "0.8rem", color: "#10b981", background: "rgba(16, 185, 129, 0.1)", padding: "0.2rem 0.5rem", borderRadius: "4px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>Verified</span>
            </div>
          </div>
        </section>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button 
          onClick={() => alert("Settings saved successfully (Mock)!")}
          style={{ padding: "0.6rem 1.5rem", borderRadius: "8px", border: "none", cursor: "pointer", background: "#3b82f6", color: "#fff", fontWeight: "bold", fontSize: "0.9rem" }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
