const ALLOWED_TRANSITIONS = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['submitted', 'cancelled'],
  submitted: ['approved', 'in_progress', 'cancelled'],
  approved: ['paid'],
  paid: [],
  cancelled: []
};

export function validateMilestoneTransition(currentStatus, newStatus) {
  if (!currentStatus || !newStatus) return false;
  if (currentStatus === newStatus) return true;

  const validTargets = ALLOWED_TRANSITIONS[currentStatus];
  if (!validTargets) return false;

  return validTargets.includes(newStatus);
}
