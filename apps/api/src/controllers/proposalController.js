import { fail, ok } from "../utils/response.js";
import { createProposalSchema } from "../validators/body.js";
import { createProposal, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  const parsed = createProposalSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Invalid request body", 400, { issues: parsed.error.issues });
  }

  return ok(res, await createProposal(parsed.data), 201);
}
