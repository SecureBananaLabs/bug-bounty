import { fail, ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createProposalSchema } from "../validators/proposal.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  const parsed = createProposalSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Invalid proposal payload", 400);
  }

  return ok(res, await createProposal(parsed.data), 201);
}
