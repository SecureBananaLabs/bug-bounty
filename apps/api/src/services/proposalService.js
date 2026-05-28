const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const { jobId, coverLetter, budget } = payload;
  const proposal = {
    jobId,
    coverLetter,
    budget,
    id: `prp_${Date.now()}`,
    status: "pending",
  };
  proposals.push(proposal);
  return proposal;
}
