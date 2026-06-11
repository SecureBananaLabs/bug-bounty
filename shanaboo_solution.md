 ```diff
--- a/apps/web/app/settings/page.tsx
+++ b/apps/web/app/settings/page.tsx
@@ -1,8 +1,196 @@
+import { 
+  User, 
+  Bell, 
+  Shield, 
+  CreditCard, 
+  ChevronRight, 
+  CheckCircle2, 
+  AlertCircle,
+  Mail,
+  Smartphone,
+  Globe,
+  Lock,
+  Eye,
+  DollarSign
+} from "lucide-react";
+
+interface StatusChipProps {
+  status: "active" | "warning" | "neutral";
+  children: React.ReactNode;
+}
+
+function StatusChip({ status, children }: StatusChipProps) {
+  const styles = {
+    active: "bg-emerald-100 text-emerald-700",
+    warning: "bg-amber-100 text-amber-700",
+    neutral: "bg-slate-100 text-slate-600",
+  };
+
+  return (
+    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
+      {status === "active" && <CheckCircle2 className="h-3 w-3" />}
+      {status === "warning" && <AlertCircle className="h-3 w-3" />}
+      {children}
+    </span>
+  );
+}
+
+interface SettingsSectionProps {
+  title: string;
+  icon: React.ReactNode;
+  children: React.ReactNode;
+}
+
+function SettingsSection({ title, icon, children }: SettingsSectionProps) {
+  return (
+    <div className="rounded-lg border border-slate-200 bg-white p-6">
+      <div className="mb-4 flex items-center gap-2">
+        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600">
+          {icon}
+        </div>
+        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
+      </div>
+      {children}
+    </div>
+  );
+}
+
+interface SettingsRowProps {
+  label: string;
+  value: React.ReactNode;
+  action?: string;
+}
+
+function SettingsRow({ label, value, action }: SettingsRowProps) {
+  return (
+    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
+      <div>
+        <p className="text-sm font-medium text-slate-700">{label}</p>
+        <div className="mt-0.5">{value}</div>
+      </div>
+      {action && (
+        <button className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
+          {action}
+          <ChevronRight className="h-4 w-4" />
+        </button>
+      )}
+    </div>
+  );
+}
+
 export default function SettingsPage() {
+  // Mock data for static settings overview
+  const accountData = {
+    name: "Alex Morgan",
+    email: "alex.morgan@example.com",
+    role: "Freelancer",
+    visibility: "Public",
+    profileCompletion: 85,
+  };
+
+  const notificationData = {
+    emailDigest: true,
+    pushNotifications: false,
+    smsAlerts: false,
+    marketingEmails: false,
+  };
+
+  const securityData = {
+    twoFactorEnabled: true,
+    lastPasswordChange: "2024-11-15",
+    activeSessions: 2,
+    loginAlerts: true,
+  };
+
+  const billingData = {
+    plan: "Pro",
+    paymentMethod: "Visa ending in 4242",
+    nextBillingDate: "2025-01-15",
+    payoutMethod: "Bank Transfer (ACH)",
+    payoutSchedule: "Weekly",
+    balance: "$1,240.00",
+  };
+
   return (
-    <section className="card">
-      <h2>Settings</h2>
-      <p>Account preferences, profile visibility, and security controls.</p>
-    </section>
+    <div className="mx-auto max-w-4xl space-y-6 p-6">
+      <div className="mb-6">
+        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
+        <p className="mt-1 text-sm text-slate-600">
+          Manage your account preferences, profile visibility, and security controls.
+        </p>
+      </div>
+
+      {/* Account / Profile */}
+      <SettingsSection title="Account & Profile" icon={<User className="h-4 w-4" />}>
+        <SettingsRow
+          label="Display Name"
+          value={<span className="text-sm text-slate-600">{accountData.name}</span>}
+          action="Edit"
+        />
+        <SettingsRow
+          label="Email Address"
+          value={<span className="text-sm text-slate-600">{accountData.email}</span>}
+          action="Change"
+        />
+        <SettingsRow
+          label="Account Type"
+          value={
+            <div className="flex items-center gap-2">
+              <span className="text-sm text-slate-600">{accountData.role}</span>
+              <StatusChip status="active">Active</StatusChip>
+            </div>
+          }
+          action="Switch"
+        />
+        <SettingsRow
+          label="Profile Visibility"
+          value={
+            <div className="flex items-center gap-2">
+              <Eye className="h-3.5 w-3.5 text-slate-400" />
+              <span className="text-sm text-slate-600">{accountData.visibility}</span>
+              <StatusChip status="active">Visible</StatusChip>
+            </div>
+          }
+          action="Configure"
+        />
+        <SettingsRow
+          label="Profile Completion"
+          value={
+            <div className="flex items-center gap-3">
+              <div className="h-2 w-32 rounded-full bg-slate-100">
+                <div
+                  className="h-2 rounded-full bg-emerald-500"
+                  style={{ width: `${accountData.profileCompletion}%` }}
+                />
+              </div>
+              <span className="text-sm text-slate-600">{account