const proposals = [];
const ALLOWED_FIELDS = ["jobId", "freelancerId", "bidAmount", "coverLetter", "estDuration"];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const sanitized = {};
  for (const field of ALLOWED_FIELDS) {
    if (payload[field] !== undefined) {
      sanitized[field] = payload[field];
    }
  }
  const proposal = { id: `prp_${Date.now()}`, ...sanitized };
  proposals.push(proposal);
  return proposal;
}
