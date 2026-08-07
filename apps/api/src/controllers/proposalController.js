import { ok, fail } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createProposalSchema } from "../validators/proposal.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  const parsed = createProposalSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0]?.message || "Invalid request", 400);
  }

  const payload = parsed.data;
  return ok(res, await createProposal(payload), 201);
}
