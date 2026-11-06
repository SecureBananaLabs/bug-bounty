import { fail, ok } from "../utils/response.js";
import { createProposalSchema } from "../validators/proposal.js";
import { createProposal, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  const parsed = createProposalSchema.safeParse(req.body);

  if (!parsed.success) {
    const [issue] = parsed.error.issues;

    return fail(res, `${issue.path.join(".")} must be valid`, 400);
  }

  return ok(res, await createProposal(parsed.data), 201);
}
