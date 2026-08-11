import React from 'react';

// Mock data for account settings
const mockAccountSettings = {
  profile: {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    avatar: 'https://i.pravatar.cc/150?u=jane.doe',
    bio: 'Full-stack developer and bug bounty hunter.',
  },
  notifications: {
    email: true,
    push: false,
    sms: true,
    digest: 'weekly',
  },
  security: {
    twoFactorEnabled: false,
    lastPasswordChange: '2024-10-15',
    activeSessions: 2,
  },
  billing: {
    plan: 'Pro',
    nextPayment: '2025-03-01',
    amount: 29.99,
    paymentMethod: 'Visa ending in 4242',
    payoutAccount: 'Bank of America - checking',
  },
};

// Status chip component
function StatusChip({ label, variant }: { label: string; variant: 'success' | 'warning' | 'error' | 'info' }) {
  const variantStyles: Record<string, string> = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]}`}>
      {label}
    </span>
  );
}

// Card component
function Card({ title, children, status }: { title: string; children: React.ReactNode; status?: React.ReactNode }) {
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {status && <div>{status}</div>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// Action button component
function ActionButton({ label, href, variant = 'primary' }: { label: string; href: string; variant?: 'primary' | 'secondary' | 'danger' }) {
  const variantStyles: Record<string, string> = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <a
      href={href}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${variantStyles[variant]} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
    >
      {label}
    </a>
  );
}

export default function SettingsPage() {
  const { profile, notifications, security, billing } = mockAccountSettings;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Account Settings</h1>

        {/* Profile Section */}
        <Card
          title="Profile"
          status={<StatusChip label="Complete" variant="success" />}
        >
          <div className="flex items-center space-x-4">
            <img
              className="h-12 w-12 rounded-full"
              src={profile.avatar}
              alt={profile.name}
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{profile.name}</p>
              <p className="text-sm text-gray-500">{profile.email}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">{profile.bio}</p>
          <div className="mt-4">
            <ActionButton label="Edit Profile" href="/settings/profile" />
          </div>
        </Card>

        {/* Notification Preferences */}
        <Card
          title="Notification Preferences"
          status={<StatusChip label="Active" variant="info" />}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Email notifications</span>
              <span className={`text-sm ${notifications.email ? 'text-green-600' : 'text-gray-400'}`}>
                {notifications.email ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Push notifications</span>
              <span className={`text-sm ${notifications.push ? 'text-green-600' : 'text-gray-400'}`}>
                {notifications.push ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">SMS notifications</span>
              <span className={`text-sm ${notifications.sms ? 'text-green-600' : 'text-gray-400'}`}>
                {notifications.sms ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Digest frequency</span>
              <span className="text-sm text-gray-600 capitalize">{notifications.digest}</span>
            </div>
          </div>
          <div className="mt-4">
            <ActionButton label="Manage Notifications" href="/settings/notifications" />
          </div>
        </Card>

        {/* Security Controls */}
        <Card
          title="Security"
          status={<StatusChip label="Action Needed" variant="warning" />}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Two-factor authentication</span>
              <span className={`text-sm ${security.twoFactorEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Last password change</span>
              <span className="text-sm text-gray-600">{security.lastPasswordChange}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Active sessions</span>
              <span className="text-sm text-gray-600">{security.activeSessions}</span>
            </div>
          </div>
          <div className="mt-4 flex space-x-3">
            <ActionButton label="Enable 2FA" href="/settings/security/2fa" variant="primary" />
            <ActionButton label="Change Password" href="/settings/security/password" variant="secondary" />
          </div>
        </Card>

        {/* Billing and Payout Settings */}
        <Card
          title="Billing & Payouts"
          status={<StatusChip label="Active" variant="success" />}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Current plan</span>
              <span className="text-sm font-medium text-gray-900">{billing.plan}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Next payment</span>
              <span className="text-sm text-gray-600">{billing.nextPayment} — ${billing.amount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Payment method</span>
              <span className="text-sm text-gray-600">{billing.paymentMethod}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Payout account</span>
              <span className="text-sm text-gray-600">{billing.payoutAccount}</span>
            </div>
          </div>
          <div className="mt-4 flex space-x-3">
            <ActionButton label="Manage Billing" href="/settings/billing" variant="primary" />
            <ActionButton label="Update Payout" href="/settings/payout" variant="secondary" />
          </div>
        </Card>
      </div>
    </div>
  );
}
