'use client';

import React, { useState, useEffect } from 'react';
import MetricsCards from './MetricsCards';
import UserManagementTable from './UserManagementTable';
import DisputeQueue from './DisputeQueue';
import ModerationQueue from './ModerationQueue';
import PlatformControls from './PlatformControls';
import AuditLogView from './AuditLogView';
import Tabs from '@/components/ui/Tabs';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('metrics');

  return (
    <div className="space-y-6">
      <Tabs 
        items={[
          { id: 'metrics', label: 'Dashboard' },
          { id: 'users', label: 'Users' },
          { id: 'moderation', label: 'Moderation' },
          { id: 'disputes', label: 'Disputes' },
          { id: 'controls', label: 'Platform Controls' },
          { id: 'audit', label: 'Audit Log' },
        ]} 
        onChange={setActiveTab} 
      />

      <main className="mt-4">
        {activeTab === 'metrics' && <MetricsCards />}
        {activeTab === 'users' && <UserManagementTable />}
        {activeTab === 'moderation' && <ModerationQueue />}
        {activeTab === 'disputes' && <DisputeQueue />}
        {activeTab === 'controls' && <PlatformControls />}
        {activeTab === 'audit' && <AuditLogView />}
      </main>
    </div>
  );
}
