const VALID_TRANSITIONS = {
  pending: ['in_progress'],
  in_progress: ['submitted'],
  submitted: ['approved'],
  approved: ['paid'],
  paid: []
};

/**
 * Validates if a milestone status transition is allowed.
 * @param {string} currentStatus - The current milestone status
 * @param {string} newStatus - The proposed new milestone status
 * @returns {boolean} - True if transition is valid, false otherwise
 */
function validateMilestoneTransition(currentStatus, newStatus) {
  if (!currentStatus || !newStatus) {
    return false;
  }

  const allowedNextStatuses = VALID_TRANSITIONS[currentStatus];
  
  if (!allowedNextStatuses) {
    return false;
  }

  return allowedNextStatuses.includes(newStatus);
}

module.exports = {
  validateMilestoneTransition
};