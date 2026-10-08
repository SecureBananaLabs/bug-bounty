async function getAdminMetrics(req, res) {
  // Placeholder: replace with actual metrics logic
  const metrics = {
    totalUsers: 0,
    totalBounties: 0,
    totalPaid: 0,
  };
  res.status(200).json(metrics);
}

module.exports = {
  getAdminMetrics,
};
