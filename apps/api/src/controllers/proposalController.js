import { createProposalSchema } from "../validators/proposal.js";
import { fail, ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  const payload = createProposalSchema.safeParse(req.body);

  if (!payload.success) {
    return fail(res, "Invalid proposal request", 400);
  }

  return ok(res, await createProposal(payload.data), 201);
}
