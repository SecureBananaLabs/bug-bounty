import { makeId } from "../utils/id.js";

const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const proposal = { id: makeId("prp"), ...payload };
  proposals.push(proposal);
  return proposal;
}
