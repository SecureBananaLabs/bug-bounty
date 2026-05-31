const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  if (!payload.estimatedDuration || typeof payload.estimatedDuration !== "number" || payload.estimatedDuration < 1) {
    throw new Error("estimatedDuration is required and must be a positive number");
  }
  const proposal = { id: `prp_${Date.now()}`, ...payload };
  proposals.push(proposal);
  return proposal;
}
