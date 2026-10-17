import { ok, fail } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createProposalSchema } from "../validators/proposal.js";
import { ZodError } from "zod";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  try {
    const payload = createProposalSchema.parse(req.body);
    return ok(res, await createProposal(payload), 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return fail(res, err.errors.map(e => e.message).join("; "), 400);
    }
    throw err;
  }
}
