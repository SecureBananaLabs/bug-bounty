const MOCK_METRICS = {
  totalUsers: 1284,
  activeJobs: 342,
  openDisputes: 7,
  revenue: 48500,
  flaggedAccounts: 3
};

export default function AdminPanelPage() {
  return (
    <section className="card">
      <h2>Admin Panel</h2>
      <ul>
        <li>Total Users: <strong>{MOCK_METRICS.totalUsers}</strong></li>
        <li>Active Jobs: <strong>{MOCK_METRICS.activeJobs}</strong></li>
        <li>Open Disputes: <strong>{MOCK_METRICS.openDisputes}</strong></li>
        <li>Revenue: <strong>${MOCK_METRICS.revenue.toLocaleString()}</strong></li>
        <li>Flagged Accounts: <strong>{MOCK_METRICS.flaggedAccounts}</strong></li>
      </ul>
    </section>
  );
}
