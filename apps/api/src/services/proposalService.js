<content>
const createProposal = (payload) => {
  // Ensure server-generated ID is always used and cannot be overridden by client
  const serverGeneratedId = `prp_${Date.now()}`;
  const proposal = { id: serverGeneratedId, ...payload };
  
  // TODO: Add actual persistence logic here
  // For now, we'll just return the proposal object
  return proposal;
};

module.exports = {
  createProposal,
};
</content>