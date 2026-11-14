import { ok } from "../utils/response.js";
import { createProposal, getProposalById, listProposals } from "../services/proposalService.js";

export async function getProposals(req, res, next) {
  try {
    return ok(res, await listProposals());
  } catch (err) {
    next(err);
  }
}

export async function getProposal(req, res, next) {
  try {
    const proposal = await getProposalById(req.params.id);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found"
      });
    }
    return ok(res, proposal);
  } catch (err) {
    next(err);
  }
}

export async function postProposal(req, res, next) {
  try {
    return ok(res, await createProposal(req.body), 201);
  } catch (err) {
    next(err);
  }
}
