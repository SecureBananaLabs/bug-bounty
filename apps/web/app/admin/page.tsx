"use client";

import React, { useState, useEffect } from "react";

// Mock data types
type User = { id: string; name: string; role: string; status: string; joinDate: string; trustScore: number };
type Job = { id: string; title: string; status: string; flaggedReason?: string };
type Dispute = { id: string; jobId: string; status: string; client: string; freelancer: string };
type AuditLog = { id: string; action: string; adminId: string; timestamp: string };

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState<User[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [flaggedJobs, setFlaggedJobs] = useState<Job[]>([]);
  
  // Platform Controls
  const [registrationsEnabled, setRegistrationsEnabled] = useState(true);
  const [postingsEnabled, setPostingsEnabled] = useState(true);

  useEffect(() => {
    // Fetch mock data on load
    setUsers([
      { id: "1", name: "Alice", role: "freelancer", status: "active", joinDate: "2026-01-01", trustScore: 98 },
      { id: "2", name: "Bob", role: "client", status: "suspended", joinDate: "2026-02-15", trustScore: 42 }
    ]);
    setDisputes([
      { id: "d1", jobId: "j1", status: "open", client: "Bob", freelancer: "Alice" }
    ]);
    setFlaggedJobs([
      { id: "j2", title: "Suspicious API Gig", status: "flagged", flaggedReason: "Spam keywords" }
    ]);
  }, []);

  const handleToggle = (setting: string, currentVal: boolean) => {
    if(confirm(`Are you sure you want to ${currentVal ? "disable" : "enable"} ${setting}?`)) {
      if(setting === "registrations") setRegistrationsEnabled(!currentVal);
      if(setting === "postings") setPostingsEnabled(!currentVal);
      alert(`Audit Log: Toggled ${setting} to ${!currentVal}`);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-gray-900 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Platform Admin Panel</h1>
        <div className="space-x-4">
          <button onClick={() => setActiveTab("dashboard")} className={`px-4 py-2 rounded ${activeTab==="dashboard"?"bg-blue-600 text-white":"bg-gray-200"}`}>Dashboard</button>
          <button onClick={() => setActiveTab("users")} className={`px-4 py-2 rounded ${activeTab==="users"?"bg-blue-600 text-white":"bg-gray-200"}`}>Users</button>
          <button onClick={() => setActiveTab("moderation")} className={`px-4 py-2 rounded ${activeTab==="moderation"?"bg-blue-600 text-white":"bg-gray-200"}`}>Moderation</button>
          <button onClick={() => setActiveTab("controls")} className={`px-4 py-2 rounded ${activeTab==="controls"?"bg-blue-600 text-white":"bg-gray-200"}`}>Controls</button>
        </div>
      </header>

      {/* DASHBOARD */}
      {activeTab === "dashboard" && (
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded shadow border-l-4 border-blue-500">
            <h3 className="text-gray-500 text-sm">Total Users</h3>
            <p className="text-3xl font-bold">{users.length}</p>
          </div>
          <div className="bg-white p-6 rounded shadow border-l-4 border-red-500">
            <h3 className="text-gray-500 text-sm">Open Disputes</h3>
            <p className="text-3xl font-bold">{disputes.length}</p>
          </div>
          <div className="bg-white p-6 rounded shadow border-l-4 border-yellow-500">
            <h3 className="text-gray-500 text-sm">Flagged Jobs</h3>
            <p className="text-3xl font-bold">{flaggedJobs.length}</p>
          </div>
          <div className="bg-white p-6 rounded shadow border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm">Revenue (Period)</h3>
            <p className="text-3xl font-bold">$12,450</p>
          </div>
        </section>
      )}

      {/* USERS */}
      {activeTab === "users" && (
        <section className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">User Management</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2">Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Trust Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b">
                  <td className="py-2">{u.name}</td>
                  <td className="capitalize">{u.role}</td>
                  <td>
                    <span className={`px-2 py-1 text-xs rounded text-white ${u.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td>{u.trustScore}</td>
                  <td className="space-x-2">
                    <button className="text-sm text-blue-600 hover:underline">Profile</button>
                    <button className="text-sm text-red-600 hover:underline">Ban</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* MODERATION */}
      {activeTab === "moderation" && (
        <div className="space-y-6">
          <section className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4 flex justify-between">
              <span>Dispute Queue</span>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">{disputes.length} Open</span>
            </h2>
            {disputes.map(d => (
              <div key={d.id} className="border p-4 rounded mb-2 flex justify-between items-center">
                <div>
                  <p className="font-semibold">Dispute on Job {d.jobId}</p>
                  <p className="text-sm text-gray-600">Client: {d.client} vs Freelancer: {d.freelancer}</p>
                </div>
                <div className="space-x-2">
                  <button className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">Rule Freelancer</button>
                  <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Rule Client</button>
                </div>
              </div>
            ))}
          </section>

          <section className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Flagged Jobs</h2>
            {flaggedJobs.map(j => (
              <div key={j.id} className="border p-4 rounded mb-2 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{j.title}</p>
                  <p className="text-sm text-red-600">Reason: {j.flaggedReason}</p>
                </div>
                <div className="space-x-2">
                  <button className="px-3 py-1 bg-green-600 text-white rounded">Approve</button>
                  <button className="px-3 py-1 bg-red-600 text-white rounded">Reject & Notify</button>
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* CONTROLS */}
      {activeTab === "controls" && (
        <section className="bg-white p-6 rounded shadow space-y-6">
          <h2 className="text-xl font-bold mb-4">Platform Controls</h2>
          
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h3 className="font-bold">New User Registrations</h3>
              <p className="text-sm text-gray-500">Allow new users to sign up on the platform.</p>
            </div>
            <button 
              onClick={() => handleToggle("registrations", registrationsEnabled)}
              className={`px-6 py-2 rounded font-bold text-white transition-colors ${registrationsEnabled ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
            >
              {registrationsEnabled ? "ENABLED" : "DISABLED"}
            </button>
          </div>

          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h3 className="font-bold">New Job Postings</h3>
              <p className="text-sm text-gray-500">Allow clients to post new jobs to the marketplace.</p>
            </div>
            <button 
              onClick={() => handleToggle("postings", postingsEnabled)}
              className={`px-6 py-2 rounded font-bold text-white transition-colors ${postingsEnabled ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
            >
              {postingsEnabled ? "ENABLED" : "DISABLED"}
            </button>
          </div>
          
          <div className="pt-4">
            <h3 className="font-bold mb-2">Recent Audit Logs</h3>
            <ul className="text-sm font-mono text-gray-600 bg-gray-100 p-4 rounded max-h-40 overflow-y-auto">
              <li>[2026-05-18 10:45] Admin ID (auth_21) suspended User Bob</li>
              <li>[2026-05-18 10:42] Admin ID (auth_21) viewed dispute #d1</li>
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}