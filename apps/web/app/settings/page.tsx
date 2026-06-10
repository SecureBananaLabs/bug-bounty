import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  // Mock data for user settings
  const userProfile = {
    name: "Alex Morgan",
    email: "alex.morgan@example.com",
    profileVisibility: "Public",
    twoFactorEnabled: true,
    notifications: {
      jobUpdates: true,
      messages: false,
      paymentUpdates: true,
      marketing: false
    },
    security: {
      twoFactor: true,
      passwordLastChanged: "2023-01-15",
      recoveryEmail: "recovery@example.com"
    },
    billing: {
      currency: "USD",
      paymentMethod: "Visa ending in 4532",
      payoutPreference: "Monthly to Bank Account"
    }
  };

  return (
    <div className="space-y-6">
      <section className="card">
        <h2>Settings</h2>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </section>

      {/* Account/Profile Section */}
      <section className="card">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Account</h3>
            <p className="text-muted-foreground">Profile visibility: {userProfile.profileVisibility}</p>
          </div>
          <Button variant="outline">Edit Profile</Button>
        </div>
        
        <div className="mt-4 space-y-2">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{userProfile.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{userProfile.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Profile Visibility</p>
            <Badge>{userProfile.profileVisibility}</Badge>
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="card">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Notification Preferences</h3>
          <Button variant="outline">Manage Notifications</Button>
        </div>
        <div className="mt-2">
          <p className="text-sm text-muted-foreground">
            Job Updates: {userProfile.notifications.jobUpdates ? 'Enabled' : 'Disabled'}
          </p>
          <p className="text-sm text-muted-foreground">
            Messages: {userProfile.notifications.messages ? 'Enabled' : 'Disabled'}
          </p>
          <p className="text-sm text-muted-foreground">
            Payment Updates: {userProfile.notifications.paymentUpdates ? 'Enabled' : 'Disabled'}
          </p>
          <p className="text-sm text-muted-foreground">
            Marketing Emails: {userProfile.notifications.marketing ? 'Enabled' : 'Disabled'}
          </p>
        </div>
      </section>

      {/* Security Section */}
      <section className="card">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Security</h3>
          <Button variant="outline">Manage Security</Button>
        </div>
        <div className="mt-2">
          <p className="text-sm">
            Two-factor authentication: {userProfile.security.twoFactor ? 'Enabled' : 'Disabled'}
          </p>
          <p className="text-sm text-muted-foreground">
            Password last changed: {userProfile.security.passwordLastChanged}
          </p>
          <p className="text-sm text-muted-foreground">
            Recovery email: {userProfile.security.recoveryEmail}
          </p>
        </div>
      </section>

      {/* Billing Section */}
      <section className="card">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Billing & Payouts</h3>
          <Button variant="outline">Manage Billing</Button>
        </div>
        <div className="mt-2">
          <p className="text-sm text-muted-foreground">Default currency: {userProfile.billing.currency}</p>
          <p className="text-sm text-muted-foreground">Payment method: {userProfile.billing.paymentMethod}</p>
          <p className="text-sm text-muted-foreground">Payout preference: {userProfile.billing.payoutPreference}</p>
        </div>
      </section>
    </div>
  );
}
