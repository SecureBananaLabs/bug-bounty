const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function sendProposal(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Request body is required');
  }
  
  const { jobId, coverLetter, bid } = payload;
  
  if (!jobId || typeof jobId !== 'string') {
    throw new Error('jobId is required');
  }
  
  if (!coverLetter || typeof coverLetter !== 'string' || coverLetter.trim().length === 0) {
    throw new Error('coverLetter is required');
  }
  
  if (bid !== undefined && (typeof bid !== 'number' || bid <= 0)) {
    throw new Error('bid must be a positive number');
  }
  
  const proposal = {
    id: `prop_${Date.now()}`,
    jobId,
    coverLetter: coverLetter.trim(),
    bid: bid || 0,
    status: 'pending',
    submittedAt: new Date().toISOString()
  };
  
  proposals.push(proposal);
  return proposal;
}
