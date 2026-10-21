export const MILESTONE_STATUSES = [
  "pending",
  "in_progress",
  "submitted",
  "approved",
  "paid"
];

export const VALID_MILESTONE_TRANSITIONS = {
  pending: ["in_progress"],
  in_progress: ["submitted"],
  submitted: ["approved"],
  approved: ["paid"],
  paid: []
};

/**
 * Validates whether a contract milestone state transition is allowed according to the lifecycle state machine.
 * State progression: pending -> in_progress -> submitted -> approved -> paid
 *
 * @param {string} currentStatus
 * @param {string} newStatus
 * @returns {boolean}
 */
export function validateMilestoneTransition(currentStatus, newStatus) {
  if (typeof currentStatus !== "string" || typeof newStatus !== "string") {
    return false;
  }
  const normalizedCurrent = currentStatus.toLowerCase().trim();
  const normalizedNew = newStatus.toLowerCase().trim();

  const allowedTransitions = VALID_MILESTONE_TRANSITIONS[normalizedCurrent];
  if (!allowedTransitions) {
    return false;
  }
  return allowedTransitions.includes(normalizedNew);
}
