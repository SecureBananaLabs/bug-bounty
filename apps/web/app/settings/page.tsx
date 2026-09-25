import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  // Mock data for user settings
  const mockUserData = {
    profile: {
      visibility: 'public',
      name: 'John Doe',
      email: 'john.doe@example.com',
      joinDate: '2023-01-15',
    },
    notifications: {
      emailEnabled: true,
      pushEnabled: false,
      SMS: 'disabled',
    },
    security: {
      twoFactor: 'enabled',
      lastPasswordChange: '2023-03-10',
      recoveryEmail: 'recovery@example.com',
    },
    billing: {
      currency: 'USD',
      paymentMethod: 'Visa ****1234',
      payoutDefault: 'PayPal'
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        
        {/* Account/Profile Section */}
        <Section 
          title="Account & Profile" 
          description="Manage your profile visibility and personal information"
          status={mockUserData.profile.visibility}
          actionText="Edit Profile"
        />
        
        {/* Notifications Section */}
        <Section 
          title="Notifications" 
          description="Control how you receive updates"
          status={mockUserData.notifications.emailEnabled ? "enabled" : "disabled"}
          actionText="Configure"
        />
        
        {/* Security Section */}
        <Section 
          title="Security" 
          description="Manage your security preferences"
          status={mockUserData.security.twoFactor}
          actionText="Update"
        />
        
        {/* Billing Section */}
        <Section 
          title="Billing & Payout" 
          description="Manage payment methods and payout preferences"
          status={mockUserData.billing.payoutDefault}
          actionText="Update"
        />
      </Card>
    </div>
  );
}

function Section({ title, description, status, actionText }: { title: string; description: string; status: string; actionText: string }) {
  return (
    <div className="mb-8 last:mb-0">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-gray-600 mt-2">{description}</p>
      <div className="flex items-center mt-3">
        <Badge variant="secondary" className="mr-4">
          {status}
        </Badge>
        <Button variant="outline" size="sm">{actionText}</Button>
      </div>
    </div>
  );
}
