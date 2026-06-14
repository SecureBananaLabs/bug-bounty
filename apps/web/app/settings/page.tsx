"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [profileVisibility, setProfileVisibility] = useState("Public");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);
  const [payoutMethod, setPayoutMethod] = useState("USDC (Base L2)");

  return (
    <section style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "2rem", marginBottom: "1.5rem", color: "#f2f5ff" }}>Settings</h2>
      <p style={{ color: "#8a9fc4", marginBottom: "2rem" }}>
        Configure and manage your account preferences, profile visibility, notifications, security posture, and billing/payout defaults.
      </p>

      {/* Account & Profile Preferences */}
      <article className="card" style={{ marginBottom: "1.5rem", padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, color: "#fff" }}>Account & Profile</h3>
          <span style={{
            background: profileVisibility === "Public" ? "#10b98122" : "#6b728022",
            color: profileVisibility === "Public" ? "#10b981" : "#9ca3af",
            border: `1px solid ${profileVisibility === "Public" ? "#10b98144" : "#6b728044"}`,
            padding: "0.25rem 0.75rem",
            borderRadius: "9999px",
            fontSize: "0.875rem",
            fontWeight: "500"
          }}>
            {profileVisibility}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", color: "#cbd5e1" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", color: "#94a3b8", marginBottom: "0.25rem" }}>Username</label>
            <input 
              type="text" 
              defaultValue="sovereign_developer" 
              disabled 
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "6px",
                border: "1px solid #2a3765",
                background: "#0f172a",
                color: "#94a3b8",
                cursor: "not-allowed"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", color: "#94a3b8", marginBottom: "0.25rem" }}>Email Address</label>
            <input 
              type="email" 
              defaultValue="sovereign@banana.labs" 
              disabled 
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "6px",
                border: "1px solid #2a3765",
                background: "#0f172a",
                color: "#94a3b8",
                cursor: "not-allowed"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", color: "#94a3b8", marginBottom: "0.25rem" }}>Profile Visibility</label>
            <select 
              value={profileVisibility} 
              onChange={(e) => setProfileVisibility(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "6px",
                border: "1px solid #2a3765",
                background: "#1e293b",
                color: "#f2f5ff",
                outline: "none"
              }}
            >
              <option value="Public">Public (Visible to everyone)</option>
              <option value="Private">Private (Only visible to you)</option>
            </select>
          </div>
        </div>
      </article>

      {/* Notification Preferences */}
      <article className="card" style={{ marginBottom: "1.5rem", padding: "1.5rem" }}>
        <h3 style={{ margin: "0 0 1.25rem 0", color: "#fff" }}>Notification Preferences</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontWeight: "500" }}>Email Alerts</p>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#94a3b8" }}>Receive gig and platform update emails.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{
                background: emailAlerts ? "#10b98122" : "#6b728022",
                color: emailAlerts ? "#10b981" : "#9ca3af",
                border: `1px solid ${emailAlerts ? "#10b98144" : "#6b728044"}`,
                padding: "0.15rem 0.5rem",
                borderRadius: "4px",
                fontSize: "0.75rem"
              }}>
                {emailAlerts ? "Enabled" : "Disabled"}
              </span>
              <button 
                onClick={() => setEmailAlerts(!emailAlerts)}
                style={{
                  background: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  padding: "0.4rem 0.75rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.875rem"
                }}
              >
                Toggle
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #2a3765", paddingTop: "1rem" }}>
            <div>
              <p style={{ margin: 0, fontWeight: "500" }}>Push Notifications</p>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#94a3b8" }}>Get instant browser notifications for messages.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{
                background: pushNotifications ? "#10b98122" : "#6b728022",
                color: pushNotifications ? "#10b981" : "#9ca3af",
                border: `1px solid ${pushNotifications ? "#10b98144" : "#6b728044"}`,
                padding: "0.15rem 0.5rem",
                borderRadius: "4px",
                fontSize: "0.75rem"
              }}>
                {pushNotifications ? "Enabled" : "Disabled"}
              </span>
              <button 
                onClick={() => setPushNotifications(!pushNotifications)}
                style={{
                  background: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  padding: "0.4rem 0.75rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.875rem"
                }}
              >
                Toggle
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Security Preferences */}
      <article className="card" style={{ marginBottom: "1.5rem", padding: "1.5rem" }}>
        <h3 style={{ margin: "0 0 1.25rem 0", color: "#fff" }}>Security Settings</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontWeight: "500" }}>Two-Factor Authentication (2FA)</p>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#94a3b8" }}>Harden your account with mobile authenticator app codes.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{
                background: twoFactor ? "#10b98122" : "#ef444422",
                color: twoFactor ? "#10b981" : "#ef4444",
                border: `1px solid ${twoFactor ? "#10b98144" : "#ef444444"}`,
                padding: "0.25rem 0.75rem",
                borderRadius: "9999px",
                fontSize: "0.875rem"
              }}>
                {twoFactor ? "Active" : "Inactive"}
              </span>
              <button 
                onClick={() => setTwoFactor(!twoFactor)}
                style={{
                  background: twoFactor ? "#ef4444" : "#10b981",
                  color: "#fff",
                  border: "none",
                  padding: "0.4rem 0.75rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.875rem"
                }}
              >
                {twoFactor ? "Disable" : "Enable"}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #2a3765", paddingTop: "1rem" }}>
            <div>
              <p style={{ margin: 0, fontWeight: "500" }}>Account Password</p>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#94a3b8" }}>Last changed: 3 days ago</p>
            </div>
            <button 
              onClick={() => alert("Mock password update workflow initiated.")}
              style={{
                background: "#4b5563",
                color: "#fff",
                border: "none",
                padding: "0.4rem 0.75rem",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.875rem"
              }}
            >
              Update Password
            </button>
          </div>
        </div>
      </article>

      {/* Payout & Billing Preferences */}
      <article className="card" style={{ marginBottom: "1.5rem", padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, color: "#fff" }}>Payout & Billing Defaults</h3>
          <span style={{
            background: "#8b5cf622",
            color: "#c084fc",
            border: "1px solid #8b5cf644",
            padding: "0.25rem 0.75rem",
            borderRadius: "9999px",
            fontSize: "0.875rem"
          }}>
            {payoutMethod}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", color: "#cbd5e1" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", color: "#94a3b8", marginBottom: "0.25rem" }}>Default Payout Destination</label>
            <select 
              value={payoutMethod} 
              onChange={(e) => setPayoutMethod(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "6px",
                border: "1px solid #2a3765",
                background: "#1e293b",
                color: "#f2f5ff",
                outline: "none"
              }}
            >
              <option value="USDC (Base L2)">USDC (Base L2 Wallet)</option>
              <option value="PayPal">PayPal (sovereign@banana.labs)</option>
              <option value="Stripe Account">Stripe Direct Deposit</option>
            </select>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #2a3765", paddingTop: "1rem" }}>
            <div>
              <p style={{ margin: 0, fontWeight: "500" }}>Next Payout Date</p>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#94a3b8" }}>June 1, 2026</p>
            </div>
            <button 
              onClick={() => alert("Navigating to detailed payout transaction records...")}
              style={{
                background: "#4b5563",
                color: "#fff",
                border: "none",
                padding: "0.4rem 0.75rem",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.875rem"
              }}
            >
              Manage Payouts
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
