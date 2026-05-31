"use client";

import { useState, type FormEvent } from "react";

/* ── tiny helpers ────────────────────────────────────────────── */

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: 14 }}>
      {children}
    </label>
  );
}

function Input({
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "0.55rem 0.75rem",
        borderRadius: 8,
        border: "1px solid #2a3765",
        background: "#0b1020",
        color: "#f2f5ff",
        fontSize: 14,
        outline: "none",
      }}
    />
  );
}

function ActionButton({
  children,
  onClick,
  variant = "primary",
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "danger";
  disabled?: boolean;
}) {
  const bg = variant === "danger" ? "#e53e3e" : "#5468ff";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#2a3765" : bg,
        color: "white",
        border: "none",
        borderRadius: 8,
        padding: "0.6rem 1.2rem",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  );
}

function StatusMessage({ kind, text }: { kind: "success" | "error"; text: string }) {
  return (
    <p style={{ marginTop: 8, fontSize: 13, color: kind === "success" ? "#48bb78" : "#fc8181" }}>{text}</p>
  );
}

/* ── Change Password Section ──────────────────────────────────── */

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus(null);

    if (newPassword !== confirmPassword) {
      setStatus({ kind: "error", text: "New password and confirmation do not match." });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ kind: "success", text: "Password changed successfully." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setStatus({ kind: "error", text: data.message || "Failed to change password." });
      }
    } catch {
      setStatus({ kind: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>🔐 Change Password</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <Label htmlFor="currentPassword">Current Password</Label>
          <Input id="currentPassword" type="password" value={currentPassword} onChange={setCurrentPassword} placeholder="Enter current password" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <Label htmlFor="newPassword">New Password</Label>
          <Input id="newPassword" type="password" value={newPassword} onChange={setNewPassword} placeholder="Enter new password" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input id="confirmPassword" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Re-enter new password" />
        </div>
        <ActionButton onClick={() => handleSubmit({ preventDefault: () => {} } as FormEvent)} disabled={loading || !currentPassword || !newPassword || !confirmPassword}>
          {loading ? "Changing…" : "Change Password"}
        </ActionButton>
        {status && <StatusMessage kind={status.kind} text={status.text} />}
      </form>
    </div>
  );
}

/* ── Update Profile Section ───────────────────────────────────── */

function UpdateProfileSection() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus(null);

    const updates: Record<string, string> = {};
    if (fullName.trim()) updates.fullName = fullName.trim();
    if (email.trim()) updates.email = email.trim();
    if (bio.trim()) updates.bio = bio.trim();

    if (Object.keys(updates).length === 0) {
      setStatus({ kind: "error", text: "Please fill in at least one field to update." });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ kind: "success", text: "Profile updated successfully." });
        setFullName("");
        setEmail("");
        setBio("");
      } else {
        setStatus({ kind: "error", text: data.message || "Failed to update profile." });
      }
    } catch {
      setStatus({ kind: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>👤 Update Profile</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" value={fullName} onChange={setFullName} placeholder="Enter your full name" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <Label htmlFor="profileEmail">Email</Label>
          <Input id="profileEmail" type="email" value={email} onChange={setEmail} placeholder="Enter your email" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself (max 500 chars)"
            maxLength={500}
            rows={3}
            style={{
              width: "100%",
              padding: "0.55rem 0.75rem",
              borderRadius: 8,
              border: "1px solid #2a3765",
              background: "#0b1020",
              color: "#f2f5ff",
              fontSize: 14,
              outline: "none",
              resize: "vertical",
            }}
          />
        </div>
        <ActionButton onClick={() => handleSubmit({ preventDefault: () => {} } as FormEvent)} disabled={loading}>
          {loading ? "Saving…" : "Update Profile"}
        </ActionButton>
        {status && <StatusMessage kind={status.kind} text={status.text} />}
      </form>
    </div>
  );
}

/* ── Delete Account Section ───────────────────────────────────── */

function DeleteAccountSection() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!password) {
      setStatus({ kind: "error", text: "Please enter your password to confirm deletion." });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token") ?? "";
      const res = await fetch("/api/settings/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ kind: "success", text: "Account deleted. You will be logged out." });
        localStorage.removeItem("token");
        // In a real app, redirect to home after a short delay
        setTimeout(() => (window.location.href = "/"), 2000);
      } else {
        setStatus({ kind: "error", text: data.message || "Failed to delete account." });
      }
    } catch {
      setStatus({ kind: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ borderColor: "#e53e3e55" }}>
      <h3 style={{ marginTop: 0, marginBottom: 12, color: "#fc8181" }}>🗑️ Delete Account</h3>
      <p style={{ fontSize: 14, color: "#a0aec0", marginBottom: 12 }}>
        Permanently delete your account and all associated data. This action cannot be undone.
      </p>

      {!confirmOpen ? (
        <ActionButton variant="danger" onClick={() => setConfirmOpen(true)}>Delete My Account</ActionButton>
      ) : (
        <div style={{ background: "#1a0a0a", borderRadius: 8, padding: 16, border: "1px solid #e53e3e55" }}>
          <p style={{ marginTop: 0, fontWeight: 600, color: "#fc8181" }}>⚠️ Confirm Account Deletion</p>
          <div style={{ marginBottom: 12 }}>
            <Label htmlFor="deletePassword">Enter your password to confirm</Label>
            <Input id="deletePassword" type="password" value={password} onChange={setPassword} placeholder="Enter your password" />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <ActionButton variant="danger" onClick={handleDelete} disabled={loading || !password}>
              {loading ? "Deleting…" : "Yes, Delete My Account"}
            </ActionButton>
            <button
              onClick={() => { setConfirmOpen(false); setPassword(""); setStatus(null); }}
              style={{
                background: "transparent",
                color: "#a0aec0",
                border: "1px solid #2a3765",
                borderRadius: 8,
                padding: "0.6rem 1.2rem",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {status && <StatusMessage kind={status.kind} text={status.text} />}
    </div>
  );
}

/* ── Main Settings Page ──────────────────────────────────────── */

export default function SettingsPage() {
  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>Settings</h2>
      <p style={{ marginTop: 0, color: "#a0aec0", marginBottom: 20 }}>
        Manage your account security, profile, and preferences.
      </p>

      <UpdateProfileSection />
      <ChangePasswordSection />
      <DeleteAccountSection />
    </div>
  );
}
