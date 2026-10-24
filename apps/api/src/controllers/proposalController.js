import { ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";
import { createProposalSchema } from "../validators/proposal.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  const parsedProposal = createProposalSchema.safeParse(req.body);

  if (!parsedProposal.success) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid proposal payload",
        details: parsedProposal.error.issues.map((issue) => ({
          path: issue.path.join("."),
          code: issue.code,
          message: issue.message,
        })),
      },
    });
  }

  return ok(res, await createProposal(parsedProposal.data), 201);
}
