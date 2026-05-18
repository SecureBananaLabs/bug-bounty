"use client";

import { useState, useEffect } from 'react';

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [isAdmin, setIsAdmin] = useState(null);

  // In a real app we'd fetch this from /api/admin/metrics
  const [metrics, setMetrics] = useState({
    totalUsers: 1405,
    activeJobs: 320,
    openDisputes: 12,
    flaggedListings: 5,
    revenue: '$45,200',
  });

  // Basic client-side guard (API is also guarded)
  useEffect(() => {
    // Simulated auth check
    const checkAuth = async () => {
      // Stub check
      setIsAdmin(true);
    };
    checkAuth();
  }, []);

  if (isAdmin === null) return <div className="p-8">Loading secure admin panel...</div>;
  if (isAdmin === false) return <div className="p-8 text-red-500">403 Forbidden - Admin Access Required</div>;

  const handleToggle = (setting) => {
    if (confirm(`Are you sure you want to toggle ${setting}?`)) {
      console.log(`${setting} toggled. Written to audit log.`);
      // API call would go here
    }
  };

  return (
    <div className="container mx-auto p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Admin Operations Center</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => alert('Data Refreshed')}>Refresh Data</button>
      </header>

      {/* Trust & Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {Object.entries(metrics).map(([key, val]) => (
          <div key={key} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm text-gray-500 dark:text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{val}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {['users', 'moderation', 'disputes', 'controls', 'audit'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 px-6 text-center font-medium capitalize ${activeTab === tab ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600 dark:bg-gray-700 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              aria-label={`View ${tab} section`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'users' && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">User Management</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {/* Mock Data Row */}
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">alice@freelance.com</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">Freelancer</td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">Profile</button>
                        <button className="text-red-600 hover:text-red-900" onClick={() => alert('User suspended')}>Suspend</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'moderation' && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Job Moderation Queue</h2>
              <p className="text-gray-600 dark:text-gray-300">5 flagged listings require manual review.</p>
              <div className="mt-4 p-4 border border-yellow-200 bg-yellow-50 dark:bg-gray-700 dark:border-yellow-600 rounded">
                <h4 className="font-bold">Build an AI Scraper</h4>
                <p className="text-sm mt-1">Flagged for: Potential TOS Violation</p>
                <div className="mt-3">
                  <button className="bg-green-500 text-white px-3 py-1 rounded mr-2 hover:bg-green-600">Approve</button>
                  <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600" onClick={() => alert('Listing rejected. User notified.')}>Reject & Notify</button>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'disputes' && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Dispute Resolution</h2>
              <div className="p-4 border border-red-200 bg-red-50 dark:bg-gray-700 dark:border-red-800 rounded">
                <h4 className="font-bold text-red-800 dark:text-red-300">Dispute #882: Non-delivery of Assets</h4>
                <p className="text-sm mt-1">Client vs Freelancer (Open)</p>
                <div className="mt-3 space-x-2">
                  <button className="border border-gray-400 px-3 py-1 rounded bg-white text-gray-800 hover:bg-gray-100">View Thread</button>
                  <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700" onClick={() => alert('Ruled in favor of Client. Refund triggered.')}>Rule for Client</button>
                  <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Rule for Freelancer</button>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'controls' && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Platform Controls</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded dark:border-gray-700">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">New User Registrations</h4>
                    <p className="text-sm text-gray-500">Allow new users to sign up.</p>
                  </div>
                  <button onClick={() => handleToggle('Registrations')} className="bg-green-500 text-white px-4 py-2 rounded font-medium">Enabled</button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded dark:border-gray-700">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">New Job Postings</h4>
                    <p className="text-sm text-gray-500">Allow clients to post new jobs.</p>
                  </div>
                  <button onClick={() => handleToggle('Job Postings')} className="bg-green-500 text-white px-4 py-2 rounded font-medium">Enabled</button>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'audit' && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Audit Log</h2>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                <li className="py-3 text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-mono text-gray-400 mr-2">2026-05-18 10:15:22</span>
                  <strong>Admin_System</strong> disabled new user registrations.
                </li>
                <li className="py-3 text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-mono text-gray-400 mr-2">2026-05-18 09:44:10</span>
                  <strong>Admin_Sarah</strong> ruled Dispute #881 in favor of Freelancer.
                </li>
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
