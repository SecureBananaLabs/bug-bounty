import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Account / Profile */}
      <Card>
        <CardHeader><CardTitle>Account / Profile</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Username</span>
            <span className="font-mono">maya-dev</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Email</span>
            <span className="font-mono">maya@example.com</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Profile visibility</span>
            <Badge variant="outline" className="bg-green-50 text-green-700">Public</Badge>
          </div>
          <Button variant="outline" size="sm">Edit profile</Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Email alerts</span>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span>Push notifications</span>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span>Weekly digest</span>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader><CardTitle>Security</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Two-factor authentication</span>
            <Badge variant="outline" className="bg-red-50 text-red-700">Disabled</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Password last changed</span>
            <span>12 days ago</span>
          </div>
          <Button variant="outline" size="sm">Change password</Button>
        </CardContent>
      </Card>

      {/* Billing / Payout preferences */}
      <Card>
        <CardHeader><CardTitle>Billing / Payouts</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Default currency</span>
            <span className="font-mono">USDC</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Payout method</span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">Crypto wallet</Badge>
          </div>
          <Button variant="outline" size="sm">Manage billing</Button>
        </CardContent>
      </Card>
    </div>
  );
}
