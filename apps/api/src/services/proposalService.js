const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(authorId, validatedData) {
  const proposal = {
    id: `prp_${Date.now()}`,
    status: "pending",
    authorId,
    jobId: validatedData.jobId,
    coverLetter: validatedData.coverLetter,
    bidAmount: validatedData.bidAmount,
    deliveryDays: validatedData.deliveryDays,
    createdAt: new Date().toISOString()
  };
  proposals.push(proposal);
  return proposal;
}
