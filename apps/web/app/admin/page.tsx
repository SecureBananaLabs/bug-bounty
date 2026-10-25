const mockMetrics = {
  totalUsers: 1204,
  activeJobs: 87,
  openReports: 14,
  pendingPayouts: 6
};

export default function AdminPanelPage() {
  return (
    <section className="card">
      <h2>Admin Panel</h2>
      <h3>Platform Overview</h3>
      <ul>
        <li>Total users: <strong>{mockMetrics.totalUsers}</strong></li>
        <li>Active jobs: <strong>{mockMetrics.activeJobs}</strong></li>
        <li>Open reports: <strong>{mockMetrics.openReports}</strong></li>
        <li>Pending payouts: <strong>{mockMetrics.pendingPayouts}</strong></li>
      </ul>
    </section>
  );
}
