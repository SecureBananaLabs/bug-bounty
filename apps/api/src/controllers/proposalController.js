import { ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { proposalCreateSchema } from "../validators/proposal.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  const parsed = proposalCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid proposal payload",
      errors: parsed.error.flatten().fieldErrors
    });
  }

  return ok(res, await createProposal(parsed.data), 201);
}
