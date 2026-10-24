import { createEntityId } from "../utils/ids.js";

const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const proposal = { id: createEntityId("prp"), ...payload };
  proposals.push(proposal);
  return proposal;
}
