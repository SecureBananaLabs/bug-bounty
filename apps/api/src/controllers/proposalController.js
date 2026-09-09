import { ZodError } from "zod";
import { fail, ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createProposalSchema } from "../validators/proposal.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  try {
    const payload = createProposalSchema.parse(req.body);
    return ok(res, await createProposal(payload), 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return fail(res, "Invalid proposal payload", 400);
    }

    throw error;
  }
}
