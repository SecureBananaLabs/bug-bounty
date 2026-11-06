import { getDb } from "../config/prisma.js";
import { ensureJob, ensureUser, mapProposal, nextId } from "./persistenceHelpers.js";

export async function listProposals() {
  const db = getDb();
  const proposals = await db.proposal.findMany({
    orderBy: { createdAt: "asc" }
  });

  return proposals.map(mapProposal);
}

export async function createProposal(payload) {
  const db = getDb();
  const id = nextId("prp", payload.id);
  const jobId = payload.jobId ?? "job_placeholder";
  const freelancerId = payload.freelancerId ?? payload.userId ?? "usr_placeholder_freelancer";

  await ensureJob(jobId);
  await ensureUser(freelancerId, "freelancer");

  const proposal = await db.proposal.create({
    data: {
      id,
      coverLetter: payload.coverLetter ?? payload.message ?? "",
      bidAmount: payload.bidAmount ?? payload.rate ?? 0,
      estDuration: payload.estDuration ?? payload.estimatedDuration ?? "",
      jobId,
      freelancerId
    }
  });

  return mapProposal(proposal);
}
