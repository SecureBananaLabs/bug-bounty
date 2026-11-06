import { createId } from "../utils/ids.js";

const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const { id, ...proposalPayload } = payload;
  const proposal = { ...proposalPayload, id: createId("prp") };
  proposals.push(proposal);
  return proposal;
}

export function resetProposals() {
  proposals.length = 0;
}
