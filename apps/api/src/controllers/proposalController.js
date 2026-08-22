import { ok } from "../utils/response.js";
import { createProposalSchema } from "../validators/proposal.js";
import { createProposal, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  const payload = createProposalSchema.parse(req.body);
  return ok(res, await createProposal(payload), 201);
}
