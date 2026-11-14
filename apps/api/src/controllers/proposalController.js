import { ok, fail } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createProposalSchema } from "../validators/content.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  const parsed = createProposalSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Invalid proposal: " + parsed.error.issues.map(i => i.message).join(", "), 400);
  }
  const authorId = req.user?.sub ?? "unknown";
  return ok(res, await createProposal(authorId, parsed.data), 201);
}
