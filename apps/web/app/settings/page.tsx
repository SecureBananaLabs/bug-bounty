import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/packages/ui/components/ui/card';
import { Button } from '@/packages/ui/components/ui/button';
import { Badge } from '@/packages/ui/components/ui/badge';

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-50">Settings</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

        {/* Account & Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Account & Profile</CardTitle>
            <CardDescription>Manage your personal information and profile visibility.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Visibility</p>
              <Badge variant="secondary" className="mt-1">Public</Badge>
              <p className="text-xs text-muted-foreground mt-2">Your profile is visible to clients and other freelancers on the marketplace.</p>
            </div>
            <Button variant="outline" size="sm">Edit Profile</Button>
            <Button variant="outline" size="sm">Manage Preferences</Button>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Control how you receive alerts and updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Notifications</p>
              <Badge variant="default" className="mt-1">Enabled</Badge>
              <p className="text-xs text-muted-foreground mt-2">Receive email updates for new job postings and messages.</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">In-app Alerts</p>
              <Badge variant="default" className="mt-1">Enabled</Badge>
              <p className="text-xs text-muted-foreground mt-2">Get instant alerts within the FreelanceFlow app.</p>
            </div>
            <Button variant="outline" size="sm">Adjust Notification Settings</Button>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Review your security posture and login activity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Two-Factor Authentication (2FA)</p>
              <Badge variant="destructive" className="mt-1">Disabled</Badge>
              <p className="text-xs text-muted-foreground mt-2">Enable 2FA for enhanced account security.</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Password Last Updated</p>
              <Badge variant="secondary" className="mt-1">2 months ago</Badge>
              <p className="text-xs text-muted-foreground mt-2">Consider updating your password regularly.</p>
            </div>
            <Button variant="outline" size="sm">Enable 2FA</Button>
            <Button variant="outline" size="sm">Change Password</Button>
            <Button variant="outline" size="sm">View Login Activity</Button>
          </CardContent>
        </Card>

        {/* Payout & Billing Section */}
        <Card>
          <CardHeader>
            <CardTitle>Payout & Billing</CardTitle>
            <CardDescription>Manage your payment methods and billing preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Default Payout Method</p>
              <Badge variant="default" className="mt-1">Bank Account</Badge>
              <p className="text-xs text-muted-foreground mt-2">Payouts are sent to your linked bank account.</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Subscription Status</p>
              <Badge variant="default" className="mt-1">Active</Badge>
              <p className="text-xs text-muted-foreground mt-2">Your FreelanceFlow premium features are active.</p>
            </div>
            <Button variant="outline" size="sm">Manage Payouts</Button>
            <Button variant="outline" size="sm">View Billing History</Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
