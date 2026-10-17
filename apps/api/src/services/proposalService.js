import { createPublicId } from "../utils/publicId.js";

const proposals = [];

export async function listProposals() {
  return proposals;
}

export async function createProposal(payload) {
  const proposal = { id: createPublicId("prp"), ...payload };
  proposals.push(proposal);
  return proposal;
}
