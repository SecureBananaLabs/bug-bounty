import { ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createProposalSchema } from "../validators/proposal.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res, next) {
  try {
    const validated = createProposalSchema.parse(req.body);
    const result = await createProposal(validated);
    return ok(res, result, 201);
  } catch (err) {
    return next(err);
  }
}
