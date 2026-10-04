<content>
import { ok, badRequest } from '../utils/response.js';
import { createProposalSchema } from '../validators/proposal.js';
import { createProposal } from '../services/proposalService.js';

export async function postProposal(req, res) {
  try {
    const payload = createProposalSchema.parse(req.body);
    return ok(res, await createProposal(payload), 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest(res, error.message);
    }
    throw error;
  }
}

export async function getProposal(req, res) {
  // Implementation
}

export async function putProposal(req, res) {
  // Implementation
}

export async function deleteProposal(req, res) {
  // Implementation
}