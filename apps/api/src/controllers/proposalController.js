import { createProposalSchema } from "../validators/proposal.js";
import { ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  return ok(res, await createProposal(createProposalSchema.parse(req.body)), 201);
}
