 ```diff
--- a/apps/web/app/settings/page.tsx
+++ b/apps/web/app/settings/page.tsx
@@ -1,7 +1,181 @@
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
+  Key,
+  Eye
+} from 'lucide-react';
+
+interface StatusChipProps {
+  label: string;
+  variant: 'success' | 'warning' | 'default';
+}
+
+function StatusChip({ label, variant }: StatusChipProps) {
+  const variantClasses = {
+    success: 'bg-green-100 text-green-700 border-green-200',
+    warning: 'bg-amber-100 text-amber-700 border-amber-200',
+    default: 'bg-gray-100 text-gray-700 border-gray-200'
+  };
+
+  return (
+    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantClasses[variant]}`}>
+      {label}
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
+    <div className="bg-white rounded-lg border border-gray-200 p-6">
+      <div className="flex items-center gap-2 mb-4">
+        <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
+          {icon}
+        </div>
+        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
+      </div>
+      <div className="space-y-4">
+        {children}
+      </div>
+    </div>
+  );
+}
+
+interface SettingsRowProps {
+  label: string;
+  value: string;
+  status?: React.ReactNode;
+  action?: string;
+}
+
+function SettingsRow({ label, value, status, action }: SettingsRowProps) {
+  return (
+    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
+      <div className="flex-1">
+        <p className="text-sm font-medium text-gray-900">{label}</p>
+        <p className="text-sm text-gray-500 mt-0.5">{value}</p>
+      </div>
+      <div className="flex items-center gap-3">
+        {status}
+        {action && (
+          <button className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
+            {action}
+            <ChevronRight className="w-4 h-4 ml-0.5" />
+          </button>
+        )}
+      </div>
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
+    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
+      <div className="mb-8">
+        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
+        <p className="mt-1 text-sm text-gray-500">Manage your account preferences, profile visibility, and security controls.</p>
+      </div>
+
+      <div className="space-y-6">
+        {/* Account / Profile */}
+        <SettingsSection title="Account & Profile" icon={<User className="w-5 h-5" />}>
+          <SettingsRow 
+            label="Display Name" 
+            value="Alex Morgan" 
+            status={<StatusChip label="Public" variant="success" />}
+            action="Edit"
+          />
+          <SettingsRow 
+            label="Username" 
+            value="@alexmorgan" 
+            status={<StatusChip label="Verified" variant="success" />}
+          />
+          <SettingsRow 
+            label="Profile Visibility" 
+            value="Visible to all users" 
+            status={<StatusChip label="Public" variant="success" />}
+            action="Change"
+          />
+          <SettingsRow 
+            label="Bio" 
+            value="Full-stack developer specializing in React and Node.js" 
+            action="Edit"
+          />
+        </SettingsSection>
+
+        {/* Notifications */}
+        <SettingsSection title="Notifications" icon={<Bell className="w-5 h-5" />}>
+          <SettingsRow 
+            label="Email Notifications" 
+            value="alexmorgan@example.com" 
+            status={<StatusChip label="Enabled" variant="success" />}
+            action="Manage"
+          />
+          <SettingsRow 
+            label="Push Notifications" 
+            value="Receive alerts on your device" 
+            status={<StatusChip label="Enabled" variant="success" />}
+            action="Configure"
+          />
+          <SettingsRow 
+            label="Marketing Emails" 
+            value="Product updates and promotions" 
+            status={<StatusChip label="Disabled" variant="default" />}
+            action="Enable"
+          />
+          <SettingsRow 
+            label="Message Alerts" 
+            value="New messages and proposals" 
+            status={<StatusChip label="Enabled" variant="success" />}
+            action="Configure"
+          />
+        </SettingsSection>
+
+        {/* Security */}
+        <SettingsSection title="Security" icon={<Shield className="w-5 h-5" />}>
+          <SettingsRow 
+            label="Password" 
+            value="Last changed 3 months ago" 
+            status={<StatusChip label="Strong" variant="success" />}
+            action="Update"
+          />
+          <SettingsRow 
+            label="Two-Factor Authentication" 
+            value="Protect your account with 2FA" 
+            status={<StatusChip label="Enabled" variant="success" />}
+            action="Manage"
+          />
+          <SettingsRow 
+            label="Active Sessions" 
+            value="3 devices currently signed in" 
+            status={<StatusChip label="Review" variant="warning" />}
+            action="Review"
+          />
+          <SettingsRow 
+