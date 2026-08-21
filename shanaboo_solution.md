 ```diff
--- a/apps/web/app/settings/page.tsx
+++ b/apps/web/app/settings/page.tsx
@@ -1,7 +1,163 @@
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
+} from 'lucide-react';
+
+const mockSettings = {
+  account: {
+    name: 'Alex Morgan',
+    email: 'alex.morgan@example.com',
+    role: 'Freelancer',
+    profileVisibility: 'Public',
+    joinDate: '2024-01-15',
+  },
+  notifications: {
+    email: true,
+    push: false,
+    marketing: true,
+    jobAlerts: true,
+    messageAlerts: true,
+  },
+  security: {
+    twoFactorEnabled: false,
+    lastPasswordChange: '2024-03-10',
+    activeSessions: 2,
+    loginAlerts: true,
+  },
+  billing: {
+    paymentMethod: 'Visa ending in 4242',
+    payoutMethod: 'Direct Deposit',
+    defaultCurrency: 'USD',
+    autoPayout: true,
+    outstandingBalance: 2840.00,
+  },
+};
+
+function StatusChip({ status, variant = 'success' }: { status: string; variant?: 'success' | 'warning' | 'neutral' }) {
+  const variants = {
+    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
+    warning: 'bg-amber-50 text-amber-700 border-amber-200',
+    neutral: 'bg-slate-50 text-slate-700 border-slate-200',
+  };
+
+  return (
+    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]}`}>
+      {variant === 'success' && <CheckCircle2 className="w-3 h-3" />}
+      {variant === 'warning' && <AlertCircle className="w-3 h-3" />}
+      {status}
+    </span>
+  );
+}
+
+function SettingsSection({ 
+  title, 
+  icon: Icon, 
+  children 
+}: { 
+  title: string; 
+  icon: React.ElementType; 
+  children: React.ReactNode 
+}) {
+  return (
+    <div className="bg-white rounded-xl border border-slate-200 p-6">
+      <div className="flex items-center gap-3 mb-5">
+        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-50">
+          <Icon className="w-5 h-5 text-slate-600" />
+        </div>
+        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
+      </div>
+      {children}
+    </div>
+  );
+}
+
+function SettingsRow({ label, value, action, icon: Icon }: { label: string; value: React.ReactNode; action?: string; icon?: React.ElementType }) {
+  return (
+    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0 last:pb-0 first:pt-0">
+      <div className="flex items-center gap-3">
+        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
+        <div>
+          <p className="text-sm font-medium text-slate-700">{label}</p>
+          <p className="text-sm text-slate-500">{value}</p>
+        </div>
+      </div>
+      {action && (
+        <button className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
+          {action}
+          <ChevronRight className="w-4 h-4" />
+        </button>
+      )}
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
+    <div className="max-w-4xl mx-auto px-4 py-8">
+      <div className="mb-8">
+        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
+        <p className="mt-1 text-slate-600">Manage your account preferences, profile visibility, and security controls.</p>
+      </div>
+
+      <div className="space-y-6">
+        {/* Account / Profile */}
+        <SettingsSection title="Account & Profile" icon={User}>
+          <SettingsRow label="Full Name" value={mockSettings.account.name} action="Edit" icon={User} />
+          <SettingsRow label="Email Address" value={mockSettings.account.email} action="Change" icon={Mail} />
+          <SettingsRow label="Account Type" value={<StatusChip status={mockSettings.account.role} variant="neutral" />} />
+          <SettingsRow label="Profile Visibility" value={<StatusChip status={mockSettings.account.profileVisibility} variant="success" />} />
+          <SettingsRow label="Member Since" value={new Date(mockSettings.account.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} icon={Globe} />
+        </SettingsSection>
+
+        {/* Notifications */}
+        <SettingsSection title="Notifications" icon={Bell}>
+          <SettingsRow label="Email Notifications" value={mockSettings.notifications.email ? 'Enabled' : 'Disabled'} action="Configure" icon={Mail} />
+          <SettingsRow label="Push Notifications" value={mockSettings.notifications.push ? 'Enabled' : 'Disabled'} action="Configure" icon={Smartphone} />
+          <SettingsRow label="Job Alerts" value={mockSettings.notifications.jobAlerts ? <StatusChip status="Active" /> : <StatusChip status="Off" variant="neutral" />} />
+          <SettingsRow label="Message Alerts" value={mockSettings.notifications.messageAlerts ? <StatusChip status="Active" /> : <StatusChip status="Off" variant="neutral" />} />
+          <SettingsRow label="Marketing Emails" value={mockSettings.notifications.marketing ? 'Subscribed'