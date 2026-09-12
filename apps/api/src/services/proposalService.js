import { snapshotList } from "./listSnapshot.js";

const proposals = [];

export async function listProposals() {
  return snapshotList(proposals);
}

export async function createProposal(payload) {
  const proposal = { id: `prp_${Date.now()}`, ...payload };
  proposals.push(proposal);
  return proposal;
}
