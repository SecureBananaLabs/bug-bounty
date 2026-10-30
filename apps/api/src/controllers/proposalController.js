import { ok } from "../utils/response.js";
import { createProposalSchema } from "../validators/proposal.js";
import { createProposal, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res, next) {
  try {
    return ok(res, await listProposals());
  } catch (err) {
    return next(err);
  }
}

export async function postProposal(req, res, next) {
  try {
    const payload = createProposalSchema.parse(req.body);
    return ok(res, await createProposal(payload), 201);
  } catch (err) {
    return next(err);
  }
}
