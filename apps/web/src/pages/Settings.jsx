import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const mockSettings = {
  profile: {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    visibility: 'public',
    status: 'complete',
    nextAction: 'Update your bio to attract more clients',
  },
  notifications: {
    email: true,
    push: false,
    sms: false,
    status: 'partial',
    nextAction: 'Enable push notifications to stay updated',
  },
  security: {
    twoFactor: false,
    lastLogin: '2024-03-15T10:30:00Z',
    status: 'warning',
    nextAction: 'Enable two-factor authentication for enhanced security',
  },
  billing: {
    payoutMethod: 'bank_transfer',
    defaultCurrency: 'USD',
    status: 'complete',
    nextAction: 'Verify your payout details to receive payments',
  },
};

const statusBadge = (status) => {
  const variants = {
    complete: 'success',
    partial: 'warning',
    warning: 'destructive',
    incomplete: 'secondary',
  };
  return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
};

export default function Settings() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="text-muted-foreground">
        Manage your account preferences, profile visibility, and security settings.
      </p>

      {/* Account & Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Account & Profile</span>
            {statusBadge(mockSettings.profile.status)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p>{mockSettings.profile.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p>{mockSettings.profile.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Visibility</p>
              <p className="capitalize">{mockSettings.profile.visibility}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Next action</p>
              <p className="text-sm">{mockSettings.profile.nextAction}</p>
            </div>
            <Button variant="outline" size="sm">Edit Profile</Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Notifications</span>
            {statusBadge(mockSettings.notifications.status)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Email notifications</span>
              <Badge variant={mockSettings.notifications.email ? 'default' : 'secondary'}>
                {mockSettings.notifications.email ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Push notifications</span>
              <Badge variant={mockSettings.notifications.push ? 'default' : 'secondary'}>
                {mockSettings.notifications.push ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>SMS notifications</span>
              <Badge variant={mockSettings.notifications.sms ? 'default' : 'secondary'}>
                {mockSettings.notifications.sms ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Next action</p>
              <p className="text-sm">{mockSettings.notifications.nextAction}</p>
            </div>
            <Button variant="outline" size="sm">Manage Notifications</Button>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Security</span>
            {statusBadge(mockSettings.security.status)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Two-Factor Auth</p>
              <Badge variant={mockSettings.security.twoFactor ? 'default' : 'secondary'}>
                {mockSettings.security.twoFactor ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Login</p>
              <p>{new Date(mockSettings.security.lastLogin).toLocaleString()}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Next action</p>
              <p className="text-sm">{mockSettings.security.nextAction}</p>
            </div>
            <Button variant="outline" size="sm">Security Settings</Button>
          </div>
        </CardContent>
      </Card>

      {/* Payout & Billing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Payout & Billing</span>
            {statusBadge(mockSettings.billing.status)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Payout Method</p>
              <p className="capitalize">{mockSettings.billing.payoutMethod.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Default Currency</p>
              <p>{mockSettings.billing.defaultCurrency}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Next action</p>
              <p className="text-sm">{mockSettings.billing.nextAction}</p>
            </div>
            <Button variant="outline" size="sm">Billing Details</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
