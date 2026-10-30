import { ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createProposalSchema } from "../validators/proposal.js";

export async function getProposals(req, res, next) {
  try {
    return ok(res, await listProposals());
  } catch (err) {
    next(err);
  }
}

export async function postProposal(req, res, next) {
  try {
    const validated = createProposalSchema.parse(req.body);
    const proposal = await createProposal(validated);
    return ok(res, proposal, 201);
  } catch (err) {
    next(err);
  }
}
