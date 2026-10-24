import { ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createProposalSchema } from "../validators/proposal.js";
import { ZodError } from "zod";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res, next) {
  try {
    const payload = createProposalSchema.parse(req.body);
    return ok(res, await createProposal(payload), 201);
  } catch (err) {
    if (err instanceof ZodError || err?.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        issues: err.issues
      });
    }
    if (next) return next(err);
    throw err;
  }
}
