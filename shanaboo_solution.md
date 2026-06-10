 ```diff
--- a/apps/web/app/settings/page.tsx
+++ b/apps/web/app/settings/page.tsx
@@ -1,7 +1,168 @@
+import Link from "next/link";
+
+interface StatusChipProps {
+  label: string;
+  variant?: "success" | "warning" | "neutral" | "danger";
+}
+
+function StatusChip({ label, variant = "neutral" }: StatusChipProps) {
+  const variantClasses = {
+    success: "bg-green-100 text-green-800",
+    warning: "bg-yellow-100 text-yellow-800",
+    neutral: "bg-gray-100 text-gray-800",
+    danger: "bg-red-100 text-red-800",
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
+  action?: {
+    label: string;
+    href: string;
+  };
+}
+
+function SettingsSection({ title, children, action }: SettingsSectionProps) {
+  return (
+    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
+      <div className="mb-4 flex items-center justify-between">
+        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
+        {action && (
+          <Link
+            href={action.href}
+            className="text-sm font-medium text-blue-600 hover:text-blue-800"
+          >
+            {action.label}
+          </Link>
+        )}
+      </div>
+      {children}
+    </div>
+  );
+}
+
 export default function SettingsPage() {
   return (
-    <section className="card">
-      <h2>Settings</h2>
-      <p>Account preferences, profile visibility, and security controls.</p>
-    </section>
+    <div className="mx-auto max-w-4xl space-y-6 p-6">
+      <div className="mb-8">
+        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
+        <p className="mt-1 text-sm text-gray-600">
+          Manage your account preferences, profile visibility, and security controls.
+        </p>
+      </div>
+
+      <SettingsSection
+        title="Account / Profile"
+        action={{ label: "Edit profile", href: "/profile/edit" }}
+      >
+        <div className="space-y-3">
+          <div className="flex items-center justify-between py-2">
+            <div>
+              <p className="text-sm font-medium text-gray-900">Profile Visibility</p>
+              <p className="text-sm text-gray-500">Your profile is discoverable by clients</p>
+            </div>
+            <StatusChip label="Public" variant="success" />
+          </div>
+          <div className="flex items-center justify-between py-2">
+            <div>
+              <p className="text-sm font-medium text-gray-900">Display Name</p>
+              <p className="text-sm text-gray-500">Alex Developer</p>
+            </div>
+          </div>
+          <div className="flex items-center justify-between py-2">
+            <div>
+              <p className="text-sm font-medium text-gray-900">Email</p>
+              <p className="text-sm text-gray-500">alex@example.com</p>
+            </div>
+            <StatusChip label="Verified" variant="success" />
+          </div>
+        </div>
+      </SettingsSection>
+
+      <SettingsSection
+        title="Notifications"
+        action={{ label: "Manage notifications", href: "/notifications/settings" }}
+      >
+        <div className="space-y-3">
+          <div className="flex items-center justify-between py-2">
+            <div>
+              <p className="text-sm font-medium text-gray-900">Email Notifications</p>
+              <p className="text-sm text-gray-500">Job invites, messages, and updates</p>
+            </div>
+            <StatusChip label="Enabled" variant="success" />
+          </div>
+          <div className="flex items-center justify-between py-2">
+            <div>
+              <p className="text-sm font-medium text-gray-900">Push Notifications</ Marble</p>
+              <p className="text-sm text-gray-500">Browser and mobile push alerts</p>
+            </div>
+            <StatusChip label="Disabled" variant="neutral" />
+          </div>
+        </div>
+      </SettingsSection>
+
+      <SettingsSection
+        title="Security"
+        action={{ label: "Security settings", href: "/security" }}
+      >
+        <div className="space-y-3">
+          <div className="flex items-center justify-between py-2">
+            <div>
+              <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
+              <p className="text-sm text-gray-500">Add an extra layer of security</p>
+            </div>
+            <StatusChip label="Not enabled" variant="warning" />
+          </div>
+          <div className="flex items-center justify-between py-2">
+            <div>
+              <p className="text-sm font-medium text-gray-900">Last Password Change</p>
+              <p className="text-sm text-gray-500">3 months ago</p>
+            </div>
+          </div>
+        </div>
+      </SettingsSection>
+
+      <SettingsSection
+        title="Billing / Payout Preferences"
+        action={{ label: "Manage billing", href: "/billing" }}
+      >
+        <div className="space-y-3">
+          <div className="flex items-center justify-between py-2">
+            <div>
+              <p className="text-sm font-medium text-gray-900">Default Payout Method</p>
+              <p className="text-sm text-gray-500">Bank transfer (ACH)</p>
+            </div>
+            <StatusChip label="Active" variant="success" />
+          </div>
+          <div className="flex items-center justify-between py-2">
+            <div>
+              <p className="text-sm font-medium