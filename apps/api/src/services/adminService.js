import { randomUUID } from "node:crypto";

const manualPayouts = new Map();

export async function getAdminMetrics() {
  return {
    openJobs: 42,
    activeFreelancers: 185,
    flaggedAccounts: 3,
    monthlyVolume: 128900,
    manualPayoutsCount: manualPayouts.size
  };
}

export async function processManualPayout(adminUserId, payload) {
  const payoutId = `pay_man_${randomUUID()}`;
  const now = new Date().toISOString();

  const record = {
    payoutId,
    recipientId: payload.recipientId,
    amount: Number(payload.amount),
    currency: (payload.currency || "USD").toUpperCase(),
    payoutMethod: payload.payoutMethod,
    destination: payload.destination,
    notes: payload.notes || null,
    status: "processed",
    processedBy: adminUserId,
    processedAt: now,
  };

  manualPayouts.set(payoutId, record);
  return record;
}

export async function listManualPayouts() {
  return Array.from(manualPayouts.values());
}

export function _clearManualPayouts() {
  manualPayouts.clear();
}
