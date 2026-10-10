export async function getAdminMetrics() {
  // TODO: Query real metrics from database
  return {
    openJobs: 0,
    activeFreelancers: 0,
    flaggedAccounts: 0,
    monthlyVolume: 0
  };
}
