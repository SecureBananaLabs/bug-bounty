import AdminDashboard from '@/components/admin/AdminDashboard';
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export const metadata = {
  title: 'Admin Panel | SecureBananaLabs',
};

export default function AdminPanelPage() {
  return (
    <div className="admin-container p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Platform Administration</h1>
        <div className="admin-actions">
          {/* Botão de Refresh Manual */}
        </div>
      </header>

      <ErrorBoundary>
        <Suspense fallback={<div className="loading-spinner">Loading Dashboard...</div>}>
          <AdminDashboard />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
