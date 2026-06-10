import { ok, fail } from "../utils/response.js";
import { createProposalSchema } from "../validators/proposal.js";
import { createProposal, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  const parsed = createProposalSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.issues.map((i) => i.message).join("; "), 400);
  }
  return ok(res, await createProposal(parsed.data), 201);
}
