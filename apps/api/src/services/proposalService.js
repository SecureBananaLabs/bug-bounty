import { createPrefixedId } from "../utils/id.js";

const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const proposal = { ...payload, id: createPrefixedId("prp") };
  proposals.push(proposal);
  return proposal;
}
