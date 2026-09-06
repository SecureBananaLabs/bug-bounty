import { fail, ok } from "../utils/response.js";
import { createProposalSchema } from "../validators/proposal.js";
import { createProposal, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  const result = createProposalSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, "Invalid request body", 400);
  }

  return ok(res, await createProposal(result.data), 201);
}
