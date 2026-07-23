import { generateId } from '../utils/id.js';

const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const proposal = { id: generateId('prp_'), ...payload };
  proposals.push(proposal);
  return proposal;
}

