 ```diff
--- a/apps/web/app/settings/page.tsx
+++ b/apps/web/app/settings/page.tsx
@@ -1,7 +1,163 @@
+import React from "react";
+
+interface StatusChipProps {
+  label: string;
+  variant?: "success" | "warning" | "default";
+}
+
+function StatusChip({ label, variant = "default" }: StatusChipProps) {
+  const variantClasses = {
+    success: "bg-green-100 text-green-800",
+    warning: "bg-yellow-100 text-yellow-800",
+    default: "bg-gray-100 text-gray-700",
+  };
+
+  return (
+    <span
+      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
+    >
+      {label}
+    </span>
+  );
+}
+
+interface SettingsSectionProps {
+  title: string;
+  children: React.ReactNode;
+}
+
+function SettingsSection({ title, children }: SettingsSectionProps) {
+  return (
+    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
+      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
+      {children}
+    </div>
+  );
+}
+
+interface SettingsRowProps {
+  label: string;
+  value: React.ReactNode;
+  action?: React.ReactNode;
+}
+
+function SettingsRow({ label, value, action }: SettingsRowProps) {
+  return (
+    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 last:pb-0 first:pt-0">
+      <div>
+        <p className="text-sm font-medium text-gray-700">{label}</p>
+        <div className="mt-1">{value}</div>
+      </div>
+      {action && <div>{action}</div>}
+    </div>
+  );
+}
+
+function Button({
+  children,
+  variant = "primary",
+}: {
+  children: React.ReactNode;
+  variant?: "primary" | "secondary";
+}) {
+  const baseClasses =
+    "inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors";
+  const variantClasses = {
+    primary: "bg-blue-600 text-white hover:bg-blue-700",
+    secondary:
+      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
+  };
+
+  return <button className={`${baseClasses} ${variantClasses[variant]}`}>{children}</button>;
+}
+
 export default function SettingsPage() {
   return (
-    <section className="card">
-      <h2>Settings</h2>
-      <p>Account preferences, profile visibility, and security controls.</p>
-    </section>
+    <div className="mx-auto max-w-4xl space-y-6 p-6">
+      <div className="mb-6">
+        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
+        <p className="mt-1 text-sm text-gray-600">
+          Manage your account preferences, profile visibility, and security controls.
+        </p>
+      </div>
+
+      {/* Account / Profile */}
+      <SettingsSection title="Account & Profile">
+        <SettingsRow
+          label="Display Name"
+          value={<span className="text-sm text-gray-600">Alex Morgan</span>}
+          action={<Button variant="secondary">Edit</Button>}
+        />
+        <SettingsRow
+          label="Email"
+          value={<span className="text-sm text-gray-600">alex.morgan@example.com</span>}
+          action={<Button variant="secondary">Change</Button>}
+        />
+        <SettingsRow
+          label="Profile Visibility"
+          value={<StatusChip label="Public" variant="success" />}
+          action={<Button variant="secondary">Manage</Button>}
+        />
+        <SettingsRow
+          label="Role"
+          value={<span className="text-sm text-gray-600">Freelancer & Client</span>}
+        />
+      </SettingsSection>
+
+      {/* Notifications */}
+      <SettingsSection title="Notifications">
+        <SettingsRow
+          label="Email Notifications"
+          value={<StatusChip label="Enabled" variant="success" />}
+          action={<Button variant="secondary">Configure</Button>}
+        />
+        <SettingsRow
+          label="Push Notifications"
+          value={<StatusChip label="Disabled" variant="default" />}
+          action={<Button variant="secondary">Enable</Button>}
+        />
+        <SettingsRow
+          label="Marketing Emails"
+          value={<StatusChip label="Opted out" variant="warning" />}
+          action={<Button variant="secondary">Manage</Button>}
+        />
+      </SettingsSection>
+
+      {/* Security */}
+      <SettingsSection title="Security">
+        <SettingsRow
+          label="Password"
+          value={<span className="text-sm text-gray-600">Last changed 3 months ago</span>}
+          action={<Button variant="secondary">Update</Button>}
+        />
+        <SettingsRow
+          label="Two-Factor Authentication"
+          value={<StatusChip label="Not enabled" variant="warning" />}
+          action={<Button>Enable 2FA</Button>}
+        />
+        <SettingsRow
+          label="Active Sessions"
+          value={<span className="text-sm text-gray-600">2 devices</span>}
+          action={<Button variant="secondary">Review</Button>}
+        />
+      </SettingsSection>
+
+      {/* Billing / Payout Preferences */}
+      <SettingsSection title="Billing & Payouts">
+        <SettingsRow
+          label="Default Payment Method"
+          value={<span className="text-sm text-gray-600">Visa ending in 4242</span>}
+          action={<Button variant="secondary">Update</Button>}
+        />
+        <SettingsRow
+          label="Payout Method"
+          value={<span className="text-sm text-gray-600">Bank transfer (ACH)</span>}
+          action={<Button variant="secondary">Edit</Button>}
+        />
+        <SettingsRow
+          label="Billing Address"
+          value={<span className="text-sm text-gray-600">San Francisco, CA 94102</span>}
+          action={<Button variant="secondary">Edit</Button>}
+        />
+        <SettingsRow
+          label="Tax Documents"
+          value={<StatusChip label="W-