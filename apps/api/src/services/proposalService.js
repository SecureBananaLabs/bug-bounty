const { v4: uuidv4 } = require('uuid');

// In-memory store for proposals
const proposals = [];

/**
 * Create a new proposal.
 * Rejects duplicate (jobId, freelancerId) submissions.
 * @param {Object} proposalData - { jobId, freelancerId, ... }
 * @returns {Object} The created proposal.
 * @throws {Error} If a duplicate proposal exists.
 */
function createProposal(proposalData) {
  const { jobId, freelancerId } = proposalData;

  if (!jobId || !freelancerId) {
    throw new Error('jobId and freelancerId are required');
  }

  // Check for duplicate (jobId, freelancerId)
  const existing = proposals.find(
    (p) => p.jobId === jobId && p.freelancerId === freelancerId
  );
  if (existing) {
    const error = new Error(
      `A proposal from freelancer ${freelancerId} for job ${jobId} already exists`
    );
    error.statusCode = 409;
    throw error;
  }

  const proposal = {
    id: uuidv4(),
    jobId,
    freelancerId,
    ...proposalData,
    createdAt: new Date().toISOString(),
  };

  proposals.push(proposal);
  return proposal;
}

/**
 * Get all proposals for a given job.
 * @param {string} jobId
 * @returns {Array}
 */
function getProposalsByJob(jobId) {
  return proposals.filter((p) => p.jobId === jobId);
}

/**
 * Get all proposals by a freelancer.
 * @param {string} freelancerId
 * @returns {Array}
 */
function getProposalsByFreelancer(freelancerId) {
  return proposals.filter((p) => p.freelancerId === freelancerId);
}

/**
 * Get a single proposal by ID.
 * @param {string} id
 * @returns {Object|null}
 */
function getProposalById(id) {
  return proposals.find((p) => p.id === id) || null;
}

/**
 * Update a proposal.
 * @param {string} id
 * @param {Object} updates
 * @returns {Object|null}
 */
function updateProposal(id, updates) {
  const index = proposals.findIndex((p) => p.id === id);
  if (index === -1) return null;

  // Prevent duplicate (jobId, freelancerId) on update if jobId/freelancerId changes
  if (updates.jobId || updates.freelancerId) {
    const newJobId = updates.jobId || proposals[index].jobId;
    const newFreelancerId = updates.freelancerId || proposals[index].freelancerId;
    const existing = proposals.find(
      (p) =>
        p.jobId === newJobId &&
        p.freelancerId === newFreelancerId &&
        p.id !== id
    );
    if (existing) {
      const error = new Error(
        `A proposal from freelancer ${newFreelancerId} for job ${newJobId} already exists`
      );
      error.statusCode = 409;
      throw error;
    }
  }

  proposals[index] = { ...proposals[index], ...updates, updatedAt: new Date().toISOString() };
  return proposals[index];
}

/**
 * Delete a proposal by ID.
 * @param {string} id
 * @returns {boolean}
 */
function deleteProposal(id) {
  const index = proposals.findIndex((p) => p.id === id);
  if (index === -1) return false;
  proposals.splice(index, 1);
  return true;
}

/**
 * Clear all proposals (for testing purposes).
 */
function clearProposals() {
  proposals.length = 0;
}

module.exports = {
  createProposal,
  getProposalsByJob,
  getProposalsByFreelancer,
  getProposalById,
  updateProposal,
  deleteProposal,
  clearProposals,
};
