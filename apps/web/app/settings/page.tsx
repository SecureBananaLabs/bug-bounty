-export default function SettingsPage() {
-  return (
-    <section className="card">
-      <h2>Settings</h2>
-      <p>Account preferences, profile visibility, and security controls.</p>
-    </section>
-  );
+import React from 'react';

+const mockData = {
+  account: {
+    profileVisibility: 'Public',
+    notificationPreferences: 'Enabled',
+    securityPosture: 'Strong',
+    billingDefaults: 'Monthly',
+  },
+  notifications: {
+    email: true,
+    inApp: true,
+  },
+  security: {
+    twoFactorAuth: false,
+    passwordStrength: 'Medium',
+  },
+  payout: {
+    method: 'Bank Transfer',
+    frequency: 'Monthly',
+  },
+};

+export default function SettingsPage() {
+  return (
+    <section className="card">
+      <h2>Settings</h2>
+      <div className="settings-sections">
+        <div className="settings-section">
+          <h3>Account</h3>
+          <p>Profile Visibility: <span className="status-chip">{mockData.account.profileVisibility}</span></p>
+          <p>Notification Preferences: <span className="status-chip">{mockData.account.notificationPreferences}</span></p>
+          <p>Security Posture: <span className="status-chip">{mockData.account.securityPosture}</span></p>
+          <p>Billing Defaults: <span className="status-chip">{mockData.account.billingDefaults}</span></p>
+          <button className="next-action">Edit Account</button>
+        </div>
+        <div className="settings-section">
+          <h3>Notifications</h3>
+          <p>Email: <span className="status-chip">{mockData.notifications.email ? 'Enabled' : 'Disabled'}</span></p>
+          <p>In-App: <span className="status-chip">{mockData.notifications.inApp ? 'Enabled' : 'Disabled'}</span></p>
+          <button className="next-action">Manage Notifications</button>
+        </div>
+        <div className="settings-section">
+          <h3>Security</h3>
+          <p>Two-Factor Auth: <span className="status-chip">{mockData.security.twoFactorAuth ? 'Enabled' : 'Disabled'}</span></p>
+          <p>Password Strength: <span className="status-chip">{mockData.security.passwordStrength}</span></p>
+          <button className="next-action">Update Security</button>
+        </div>
+        <div className="settings-section">
+          <h3>Payout/Billing</h3>
+          <p>Method: <span className="status-chip">{mockData.payout.method}</span></p>
+          <p>Frequency: <span className="status-chip">{mockData.payout.frequency}</span></p>
+          <button className="next-action">Update Payout/Billing</button>
+        </div>
+      </div>
+    </section>
+  );
}