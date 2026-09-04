import { ok, fail } from "../utils/response.js";
import { createProposalSchema } from "../validators/proposal.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { ZodError } from "zod";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res, next) {
  try {
    const payload = createProposalSchema.parse(req.body);
    return ok(res, await createProposal(payload), 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return fail(res, error.errors, 400);
    }
    return next(error);
  }
}
