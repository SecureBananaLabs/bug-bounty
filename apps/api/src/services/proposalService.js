const proposals = [];
let proposalCounter = 0;

function generateProposalId() {
  proposalCounter++;
  return `prp_${Date.now()}_${proposalCounter}`;
}

/** @internal Test-only: clear all stored proposals */
export function _reset() {
  proposals.length = 0;
}

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload = {}) {
  const proposal = {
    ...payload,
    id: generateProposalId(),
  };
  proposals.push(proposal);
  return proposal;
}
