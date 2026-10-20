import { ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createProposalSchema } from "../validators/proposal.js";

export async function getProposals(req, res) {
  const userId = req.user?.sub;
  return ok(res, await listProposals(userId));
}

export async function postProposal(req, res) {
  const payload = createProposalSchema.parse(req.body);
  const userId = req.user?.sub;
  return ok(res, await createProposal(userId, payload), 201);
}
