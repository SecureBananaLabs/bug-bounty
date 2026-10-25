const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const duration = payload?.estimatedDuration ?? payload?.duration;
  if (duration === undefined || duration === null || typeof duration !== "number" || duration <= 0) {
    const error = new Error("estimatedDuration is required and must be a positive number");
    error.status = 400;
    throw error;
  }

  const proposal = { id: `prp_${Date.now()}`, ...payload, estimatedDuration: duration };
  proposals.push(proposal);
  return proposal;
}
