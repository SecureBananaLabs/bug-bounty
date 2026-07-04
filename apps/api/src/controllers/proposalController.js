import { ok, fail } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createProposalSchema } from "../validators/proposal.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  try {
    const validated = createProposalSchema.parse(req.body);
    return ok(res, await createProposal(validated), 201);
  } catch (err) {
    if (err.name === "ZodError" || err.constructor?.name === "ZodError") {
      return fail(res, err.errors, 400);
    }
    return fail(res, err.message || "Invalid request body", 400);
  }
}
