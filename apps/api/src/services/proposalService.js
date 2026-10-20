const proposals = [];

export async function listProposals(userId) {
  return proposals.filter(p => p.userId === userId);
}

export async function createProposal(userId, payload) {
  const proposal = { 
    id: `prp_${Date.now()}`, 
    userId,
    jobId: payload.jobId,
    coverLetter: payload.coverLetter,
    bidAmount: payload.bidAmount,
    estimatedDays: payload.estimatedDays,
    status: "pending",
    createdAt: new Date().toISOString()
  };
  proposals.push(proposal);
  return proposal;
}
