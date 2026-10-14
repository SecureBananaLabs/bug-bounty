import { Card } from '@freelanceflow/ui';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>

      {/* Account / Profile */}
      <Card title="Account & Profile">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>Account visibility</span>
            <span className="text-green-600">Public</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Display name</span>
            <span>John Doe</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Email</span>
            <span>john.doe@example.com</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Member since</span>
            <span>January 2025</span>
          </div>
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card title="Notifications">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>Email notifications</span>
            <span className="text-green-600">Enabled</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Push notifications</span>
            <span className="text-yellow-600">Disabled</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Weekly digest</span>
            <span className="text-green-600">Enabled</span>
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card title="Security">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>Two-factor authentication</span>
            <span className="text-red-600">Not configured</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Last password change</span>
            <span>3 months ago</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Active sessions</span>
            <span>2</span>
          </div>
        </div>
      </Card>

      {/* Billing / Payout */}
      <Card title="Billing & Payout">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>Payment method</span>
            <span>Visa ending in 4242</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Payout account</span>
            <span>Bank account •••• 1234</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Default currency</span>
            <span>USD ($)</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
