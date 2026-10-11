"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../utils";

export default function Controls() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/settings");
      setSettings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const toggleSetting = async (key: string) => {
    if (!settings) return;
    const newValue = !settings[key];
    const confirmMsg = `Are you sure you want to ${newValue ? 'enable' : 'disable'} ${key}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await apiFetch("/api/admin/settings", {
        method: 'PUT',
        body: JSON.stringify({ ...settings, [key]: newValue }),
      });
      fetchSettings();
    } catch (err: any) {
      alert("Failed to update settings: " + err.message);
    }
  };

  if (loading) return <div>Loading settings...</div>;
  if (!settings) return <div>No settings available.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3>Platform Controls</h3>
      <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4>New User Registrations</h4>
            <p style={{ fontSize: '14px', color: '#666' }}>Allow new users to sign up on the platform.</p>
          </div>
          <button 
            onClick={() => toggleSetting('registrationsEnabled')}
            style={{ 
              padding: '10px 20px', 
              borderRadius: '20px', 
              border: 'none',
              background: settings.registrationsEnabled ? '#22c55e' : '#ef4444',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            {settings.registrationsEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        <div style={{ height: '1px', background: '#eee' }}></div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4>New Job Postings</h4>
            <p style={{ fontSize: '14px', color: '#666' }}>Allow clients to post new jobs.</p>
          </div>
          <button 
            onClick={() => toggleSetting('jobPostingsEnabled')}
            style={{ 
              padding: '10px 20px', 
              borderRadius: '20px', 
              border: 'none',
              background: settings.jobPostingsEnabled ? '#22c55e' : '#ef4444',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            {settings.jobPostingsEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

      </div>
    </div>
  );
}
