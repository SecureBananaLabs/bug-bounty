import { fail, ok } from "../utils/response.js";
import { createProposal, listProposals } from "../services/proposalService.js";

function isValidProposal(payload) {
  return (
    typeof payload?.bidAmount === "number" &&
    Number.isFinite(payload.bidAmount) &&
    payload.bidAmount >= 0 &&
    typeof payload.estimatedDays === "number" &&
    Number.isFinite(payload.estimatedDays) &&
    payload.estimatedDays >= 0 &&
    typeof payload.coverLetter === "string" &&
    payload.coverLetter.trim() !== ""
  );
}

export async function getProposals(req, res) {
  return ok(res, await listProposals());
}

export async function postProposal(req, res) {
  if (!isValidProposal(req.body)) {
    return fail(res, "Invalid proposal payload");
  }

  return ok(res, await createProposal(req.body), 201);
}
