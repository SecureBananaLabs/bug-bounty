import { getAdminData } from "./adminData.js";

function getDisputeRecord(disputeId) {
  return getAdminData().disputes.find((dispute) => dispute.id === disputeId) ?? null;
}

function normalizeDecision(decision) {
  if (decision === "buyer" || decision === "client") {
    return "buyer";
  }

  if (decision === "seller" || decision === "freelancer") {
    return "seller";
  }

  return null;
}

export async function listAdminDisputes(filters = {}) {
  const disputes = getAdminData().disputes.filter((dispute) => {
    if (filters.status && dispute.status !== filters.status) {
      return false;
    }

    return true;
  });

  return {
    disputes,
    total: disputes.length
  };
}

export async function getAdminDispute(disputeId) {
  const dispute = getDisputeRecord(disputeId);
  if (!dispute) {
    const error = new Error("Dispute not found");
    error.status = 404;
    throw error;
  }

  return dispute;
}

export async function resolveAdminDispute(disputeId, payload = {}, adminId = null) {
  const dispute = getDisputeRecord(disputeId);
  if (!dispute) {
    const error = new Error("Dispute not found");
    error.status = 404;
    throw error;
  }

  if (!["open", "under_review"].includes(dispute.status)) {
    const error = new Error("Only open disputes can be resolved");
    error.status = 409;
    throw error;
  }

  const ruledInFavorOf = normalizeDecision(payload.decision);
  if (!ruledInFavorOf) {
    const error = new Error("Decision must favor buyer/client or seller/freelancer");
    error.status = 400;
    throw error;
  }

  const resolvedAt = new Date().toISOString();
  dispute.status = "resolved";
  dispute.updatedAt = resolvedAt;
  dispute.resolution = {
    ruledInFavorOf,
    reason: payload.reason ?? "Resolved by admin",
    decidedBy: adminId,
    decidedAt: resolvedAt
  };

  return dispute;
}

