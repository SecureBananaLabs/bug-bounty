"use client";

import { useState } from "react";

const mockSettings = {
  account: {
    email: "user@example.com",
    username: "johndoe",
    displayName: "John Doe",
    profileVisibility: "public",
    memberSince: "2026-01-15",
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    jobAlerts: true,
    messageAlerts: true,
  },
  security: {
    twoFactorEnabled: false,
    lastPasswordChange: "2026-06-01",
    activeSessions: 2,
    loginHistory: [
      { date: "2026-07-26", ip: "192.168.1.1", device: "Chrome on Windows" },
    ],
  },
  billing: {
    plan: "Free",
    paymentMethod: "None",
    nextBillingDate: null,
    outstandingBalance: 0,
    payoutMethod: "Not configured",
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(mockSettings);

  const toggleNotification = (key: keyof typeof settings.notifications) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      {/* Account Section */}
      <section className="card settings-section">
        <div className="section-header">
          <h2>Account & Profile</h2>
          <span className="status-chip active">Active</span>
        </div>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Email</label>
            <span>{settings.account.email}</span>
          </div>
          <div className="setting-item">
            <label>Username</label>
            <span>{settings.account.username}</span>
          </div>
          <div className="setting-item">
            <label>Display Name</label>
            <span>{settings.account.displayName}</span>
          </div>
          <div className="setting-item">
            <label>Profile Visibility</label>
            <span className="status-chip">{settings.account.profileVisibility}</span>
          </div>
          <div className="setting-item">
            <label>Member Since</label>
            <span>{settings.account.memberSince}</span>
          </div>
        </div>
        <button className="btn-secondary">Edit Profile</button>
      </section>

      {/* Notifications Section */}
      <section className="card settings-section">
        <div className="section-header">
          <h2>Notifications</h2>
          <span className="status-chip">
            {Object.values(settings.notifications).filter(Boolean).length} active
          </span>
        </div>
        <div className="settings-grid">
          {Object.entries(settings.notifications).map(([key, value]) => (
            <div key={key} className="setting-item toggle">
              <label>{key.replace(/([A-Z])/g, " $1").trim()}</label>
              <button
                className={`toggle-btn ${value ? "active" : ""}`}
                onClick={() =>
                  toggleNotification(
                    key as keyof typeof settings.notifications
                  )
                }
              >
                {value ? "ON" : "OFF"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Security Section */}
      <section className="card settings-section">
        <div className="section-header">
          <h2>Security</h2>
          <span
            className={`status-chip ${
              settings.security.twoFactorEnabled ? "active" : "warning"
            }`}
          >
            {settings.security.twoFactorEnabled
              ? "2FA Enabled"
              : "2FA Disabled"}
          </span>
        </div>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Two-Factor Authentication</label>
            <span>
              {settings.security.twoFactorEnabled
                ? "Enabled"
                : "Not configured"}
            </span>
          </div>
          <div className="setting-item">
            <label>Last Password Change</label>
            <span>{settings.security.lastPasswordChange}</span>
          </div>
          <div className="setting-item">
            <label>Active Sessions</label>
            <span>{settings.security.activeSessions}</span>
          </div>
        </div>
        <div className="action-buttons">
          <button className="btn-secondary">
            {settings.security.twoFactorEnabled
              ? "Manage 2FA"
              : "Enable 2FA"}
          </button>
          <button className="btn-secondary">Change Password</button>
          <button className="btn-secondary">View Login History</button>
        </div>
      </section>

      {/* Billing Section */}
      <section className="card settings-section">
        <div className="section-header">
          <h2>Billing & Payouts</h2>
          <span className="status-chip">{settings.billing.plan}</span>
        </div>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Current Plan</label>
            <span>{settings.billing.plan}</span>
          </div>
          <div className="setting-item">
            <label>Payment Method</label>
            <span>{settings.billing.paymentMethod}</span>
          </div>
          <div className="setting-item">
            <label>Outstanding Balance</label>
            <span>${settings.billing.outstandingBalance.toFixed(2)}</span>
          </div>
          <div className="setting-item">
            <label>Payout Method</label>
            <span className="status-chip warning">
              {settings.billing.payoutMethod}
            </span>
          </div>
        </div>
        <div className="action-buttons">
          <button className="btn-primary">Upgrade Plan</button>
          <button className="btn-secondary">Add Payment Method</button>
          <button className="btn-secondary">Configure Payouts</button>
        </div>
      </section>

      <style jsx>{`
        .settings-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }
        .settings-page h1 {
          margin-bottom: 2rem;
        }
        .settings-section {
          margin-bottom: 1.5rem;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .section-header h2 {
          margin: 0;
          font-size: 1.25rem;
        }
        .settings-grid {
          display: grid;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #1a2340;
          border-radius: 8px;
        }
        .setting-item label {
          color: #8892b0;
          font-size: 0.9rem;
        }
        .setting-item span {
          font-weight: 500;
        }
        .status-chip {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          background: #2a3765;
          color: #f2f5ff;
        }
        .status-chip.active {
          background: #10b981;
          color: #000;
        }
        .status-chip.warning {
          background: #f59e0b;
          color: #000;
        }
        .toggle-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        .toggle-btn.active {
          background: #10b981;
          color: #000;
        }
        .toggle-btn:not(.active) {
          background: #4a5568;
          color: #f2f5ff;
        }
        .action-buttons {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
        }
        .btn-primary,
        .btn-secondary {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        .btn-primary {
          background: #6366f1;
          color: white;
        }
        .btn-primary:hover {
          background: #4f46e5;
        }
        .btn-secondary {
          background: #2a3765;
          color: #f2f5ff;
        }
        .btn-secondary:hover {
          background: #3a4775;
        }
      `}</style>
    </div>
  );
}
