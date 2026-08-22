import React from 'react';

// Helper function to determine status chip styling
const getStatusChipClasses = (status: string) => {
  switch (status) {
    case 'Complete':
    case 'Active':
    case 'Strong':
    case 'Configured':
      return 'bg-green-100 text-green-800';
    case 'Needs Attention':
    case 'Not Configured':
      return 'bg-yellow-100 text-yellow-800';
    case 'Pending':
      return 'bg-blue-100 text-blue-800';
    case 'Disabled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

interface SettingsCardProps {
  title: string;
  description: string;
  status: string;
  actionText: string;
  actionLink: string;
}

const SettingsCard: React.FC<SettingsCardProps> = ({ title, description, status, actionText, actionLink }) => {
  const chipClasses = getStatusChipClasses(status);
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <div className="mb-4 sm:mb-0">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">{title}</h2>
        <p className="text-gray-600 mb-3 text-sm">{description}</p>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${chipClasses}`}>
          {status}
        </span>
      </div>
      <a
        href={actionLink}
        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
      >
        {actionText}
        <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 -mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </a>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 text-center sm:text-left">Account Settings</h1>

      <div className="max-w-4xl mx-auto">
        <SettingsCard
          title="Account & Profile"
          description="Manage your personal information, profile visibility, and public details like name and avatar."
          status="Complete"
          actionText="Edit Profile"
          actionLink="/settings/profile"
        />

        <SettingsCard
          title="Notifications"
          description="Configure how you receive alerts and updates, including email preferences and in-app notifications."
          status="Active"
          actionText="Manage Notifications"
          actionLink="/settings/notifications"
        />

        <SettingsCard
          title="Security"
          description="Update your password, enable two-factor authentication, and review recent account activity for security."
          status="Needs Attention" 
          actionText="Update Security"
          actionLink="/settings/security"
        />

        <SettingsCard
          title="Payout & Billing"
          description="Set up payment methods, manage your subscriptions, and view your billing history and invoices."
          status="Not Configured"
          actionText="Set up Payouts"
          actionLink="/settings/billing"
        />
      </div>
    </div>
  );
};

export default SettingsPage;
