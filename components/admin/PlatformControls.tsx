'use client';

import React, { useState } from 'react';
import { Modal, Button, Switch, Toast } from '@/components/ui';
import { updatePlatformSetting } from '@/lib/api/admin';

export default function PlatformControls() {
  const [isConfirming, setIsConfirming] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (settingId: string, currentValue: boolean) => {
    setIsConfirming(settingId);
  };

  const confirmToggle = async (settingId: string, currentValue: boolean) => {
    setIsConfirming(null);
    setLoading(true);
    try {
      await updatePlatformSetting(settingId, !currentValue);
      Toast.success('Setting updated successfully');
    } catch (error) {
      Toast.error('Failed to update setting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 bg-white shadow rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Global Platform Controls</h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span>Allow New User Registrations</span>
          <Switch 
            defaultChecked={true} 
            onCheckedChange={(val) => handleToggle('ALLOW_REGISTRATION', val)} 
          />
        </div>
        <div className="flex justify-between items-center">
          <span>Allow New Job Postings</span>
          <Switch 
            defaultChecked={true} 
            onCheckedChange={(val) => handleToggle('ALLOW_JOBS', val)} 
          />
        </div>
      </div>

      {isConfirming && (
        <Modal 
          title="Confirm Action"
          onConfirm={() => confirmToggle(isConfirming, true)} // Simplified logic
          onCancel={() => setIsConfirming(null)}
        >
          <p>Are you sure you want to change this platform-wide setting? This action will be logged.</p>
        </Modal>
      )}
    </div>
  );
}
