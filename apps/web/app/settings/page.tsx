"use client";

import { useState } from "react";

interface SettingsSection {
  id: string;
  title: string;
  description: string;
}

const sections: SettingsSection[] = [
  {
    id: "profile",
    title: "Profile & Account",
    description: "Manage your profile information and account settings",
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Configure notification preferences and delivery methods",
  },
  {
    id: "security",
    title: "Security",
    description: "Password, two-factor authentication, and login settings",
  },
  {
    id: "billing",
    title: "Billing & Payouts",
    description: "Payment methods, billing history, and payout preferences",
  },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <nav className="space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                activeSection === section.id
                  ? "bg-blue-100 text-blue-700"
                  : "hover:bg-gray-100"
              }`}
            >
              <div className="font-medium">{section.title}</div>
              <div className="text-sm text-gray-500">{section.description}</div>
            </button>
          ))}
        </nav>

        {/* Main Content */}
        <main className="md:col-span-3">
          <div className="card">
            {activeSection === "profile" && <ProfileSection />}
            {activeSection === "notifications" && <NotificationsSection />}
            {activeSection === "security" && <SecuritySection />}
            {activeSection === "billing" && <BillingSection />}
          </div>
        </main>
      </div>
    </div>
  );
}

function ProfileSection() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Profile & Account</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Display Name</label>
          <input
            type="text"
            className="w-full p-3 border rounded-lg"
            placeholder="Your display name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            className="w-full p-3 border rounded-lg"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Bio</label>
          <textarea
            className="w-full p-3 border rounded-lg"
            rows={4}
            placeholder="Tell us about yourself"
          />
        </div>
        <button className="btn-primary">Save Changes</button>
      </div>
    </div>
  );
}

function NotificationsSection() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Notifications</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="font-medium">Email Notifications</div>
            <div className="text-sm text-gray-500">Receive updates via email</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="font-medium">Push Notifications</div>
            <div className="text-sm text-gray-500">Receive push notifications</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
}

function SecuritySection() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Security</h2>
      <div className="space-y-6">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-800">Change Password</h3>
          <p className="text-sm text-yellow-600 mt-1">Update your password regularly for security</p>
          <button className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
            Change Password
          </button>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-medium text-green-800">Two-Factor Authentication</h3>
          <p className="text-sm text-green-600 mt-1">Add an extra layer of security to your account</p>
          <button className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Enable 2FA
          </button>
        </div>
      </div>
    </div>
  );
}

function BillingSection() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Billing & Payouts</h2>
      <div className="space-y-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium">Payment Methods</h3>
          <p className="text-sm text-gray-500 mt-1">Manage your payment methods</p>
          <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add Payment Method
          </button>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium">Billing History</h3>
          <p className="text-sm text-gray-500 mt-1">View your past transactions</p>
          <button className="mt-3 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
            View History
          </button>
        </div>
      </div>
    </div>
  );
}
