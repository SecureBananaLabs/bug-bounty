const metrics = {
  openJobs: 42,
  activeFreelancers: 185,
  flaggedAccounts: 3,
  monthlyVolume: 128900
};

export default function AdminPanelPage() {
  return (
    <section>
      <h2>Admin Panel</h2>
      <div className="grid">
        <article className="card">
          <h3>Open Jobs</h3>
          <p>{metrics.openJobs}</p>
        </article>
        <article className="card">
          <h3>Active Freelancers</h3>
          <p>{metrics.activeFreelancers}</p>
        </article>
        <article className="card">
          <h3>Flagged Accounts</h3>
          <p>{metrics.flaggedAccounts}</p>
        </article>
        <article className="card">
          <h3>Monthly Volume</h3>
          <p>${metrics.monthlyVolume.toLocaleString()}</p>
        </article>
      </div>
    </section>
  );
}
