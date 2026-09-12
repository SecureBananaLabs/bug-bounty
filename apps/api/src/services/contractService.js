/**
 * @file contractService.js
 * Contract milestone lifecycle management and status transition validation state machine.
 */

'use strict';

export const MILESTONE_STATUSES = Object.freeze({
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  PAID: 'paid',
  CANCELLED: 'cancelled',
});

const VALID_TRANSITIONS = Object.freeze({
  [MILESTONE_STATUSES.PENDING]: new Set([
    MILESTONE_STATUSES.IN_PROGRESS,
    MILESTONE_STATUSES.CANCELLED,
  ]),
  [MILESTONE_STATUSES.IN_PROGRESS]: new Set([
    MILESTONE_STATUSES.SUBMITTED,
    MILESTONE_STATUSES.CANCELLED,
  ]),
  [MILESTONE_STATUSES.SUBMITTED]: new Set([
    MILESTONE_STATUSES.APPROVED,
    MILESTONE_STATUSES.IN_PROGRESS, // Revision requested
    MILESTONE_STATUSES.CANCELLED,
  ]),
  [MILESTONE_STATUSES.APPROVED]: new Set([
    MILESTONE_STATUSES.PAID,
  ]),
  [MILESTONE_STATUSES.PAID]: new Set(),
  [MILESTONE_STATUSES.CANCELLED]: new Set(),
});

/**
 * Validates whether a milestone status transition is allowed.
 *
 * @param {string} currentStatus - Current milestone status.
 * @param {string} newStatus - Desired target status.
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateMilestoneTransition(currentStatus, newStatus) {
  if (!currentStatus || typeof currentStatus !== 'string') {
    return {
      valid: false,
      message: `Invalid currentStatus: received ${currentStatus}`,
    };
  }

  if (!newStatus || typeof newStatus !== 'string') {
    return {
      valid: false,
      message: `Invalid newStatus: received ${newStatus}`,
    };
  }

  const normalizedCurrent = currentStatus.toLowerCase().trim();
  const normalizedNew = newStatus.toLowerCase().trim();

  const allowedNext = VALID_TRANSITIONS[normalizedCurrent];
  if (!allowedNext) {
    return {
      valid: false,
      message: `Unknown milestone status: ${currentStatus}`,
    };
  }

  if (normalizedCurrent === normalizedNew) {
    return {
      valid: false,
      message: `Milestone is already in status "${currentStatus}"`,
    };
  }

  if (!allowedNext.has(normalizedNew)) {
    return {
      valid: false,
      message: `Cannot transition milestone status from "${currentStatus}" to "${newStatus}"`,
    };
  }

  return { valid: true };
}

/**
 * Helper returning boolean indicating if a transition is valid.
 *
 * @param {string} currentStatus
 * @param {string} newStatus
 * @returns {boolean}
 */
export function isValidMilestoneTransition(currentStatus, newStatus) {
  return validateMilestoneTransition(currentStatus, newStatus).valid;
}
