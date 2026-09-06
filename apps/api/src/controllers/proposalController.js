import { ok, fail } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { proposalSchema } from "../validators/proposal.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  const result = proposalSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, result.error.flatten(), 422);
  }
  return ok(res, await createProposal(result.data), 201);
}
