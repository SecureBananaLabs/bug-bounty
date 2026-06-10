import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  // Mock data for user settings
  const userProfile = {
    name: "John Doe",
    email: "john.doe@example.com",
    visibility: "Public",
    joinDate: "January 2023",
  };

  const notificationSettings = {
    email: true,
    SMS: false,
    push: true,
  };

  const securitySettings = {
    twoFactor: "Enabled",
    lastPasswordChange: "2023-09-15",
    activeSessions: 3,
  };

  const billingSettings = {
    paymentMethod: "Visa ending in 4242",
    payoutMethod: "Bank Transfer",
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Profile</h2>
              <div className="mt-2 space-y-2">
                <p><span className="font-medium">Name:</span> {userProfile.name}</p>
                <p><span className="font-medium">Email:</span> {userProfile.email}</p>
                <p><span className="font-medium">Profile Visibility:</span> <Badge variant="secondary">{userProfile.visibility}</Badge></p>
                <p><span className="font-medium">Member since:</span> {userProfile.joinDate}</p>
              </div>
              <Separator className="my-4" />
              <div className="flex items-center">
                <div>
                  <h2 className="text-xl font-semibold">Notifications</h2>
                  <div className="mt-2 space-y-2">
                    <p>Email notifications: {notificationSettings.email ? 'Enabled' : 'Disabled'}</p>
                    <p>SMS notifications: {notificationSettings.SMS ? 'Enabled' : 'Disabled'}</p>
                    <p>Push notifications: {notificationSettings.push ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>
                <Separator className="my-4" />
                <div>
                  <h2 className="text-xl font-semibold">Security</h2>
                  <div className="mt-2 space-y-2">
                    <p>Two-factor authentication: <Badge variant={securitySettings.twoFactor === 'Enabled' ? 'default' : 'destructive'}>
                      {securitySettings.twoFactor}
                    </Badge></p>
                    <p>Last password change: {securitySettings.lastPasswordChange}</p>
                    <p>Active sessions: {securitySettings.activeSessions}</p>
                    <Button className="mt-2">Review Devices</Button>
                  </div>
                </div>
                <Separator className="my-4" />
                <div>
                  <h2 className="text-xl font-semibold">Billing & Payout</h2>
                  <div className="mt-2 space-y-2">
                    <p>Default payment method: {billingSettings.paymentMethod}</p>
                    <p>Default payout method: {billingSettings.payoutMethod}</p>
                    <div className="flex space-x-2">
                      <Button className="mt-2">Update Payment</Button>
                      <Button className="mt-2" variant="secondary">Update Payout</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
