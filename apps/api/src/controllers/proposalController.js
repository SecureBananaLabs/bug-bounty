import { fail, ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";

function isBlank(value) {
  return typeof value !== "string" || value.trim() === "";
}

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  const { jobId, coverLetter, bidAmount, estimatedDuration } = req.body ?? {};
  if (
    isBlank(jobId) ||
    isBlank(coverLetter) ||
    !Number.isFinite(Number(bidAmount)) ||
    Number(bidAmount) <= 0 ||
    isBlank(estimatedDuration)
  ) {
    return fail(res, "jobId, coverLetter, positive bidAmount, and estimatedDuration are required", 400);
  }

  return ok(res, await createProposal(req.body), 201);
}
