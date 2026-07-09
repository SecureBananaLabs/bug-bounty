const { v4: uuidv4 } = require('uuid');

// In-memory proposal store
let proposals = [];

class ProposalService {
  /**
   * Create a new proposal.
   * @param {Object} proposalData - { jobId, freelancerId, coverLetter, rate, ... }
   * @returns {Object} created proposal
   * @throws {Error} if duplicate (jobId, freelancerId) exists
   */
  createProposal(proposalData) {
    const { jobId, freelancerId } = proposalData;

    // Reject duplicate proposal from same freelancer for same job
    const existing = proposals.find(
      (p) => p.jobId === jobId && p.freelancerId === freelancerId
    );
    if (existing) {
      const error = new Error(
        `Freelancer ${freelancerId} has already submitted a proposal for job ${jobId}`
      );
      error.statusCode = 409;
      throw error;
    }

    const proposal = {
      id: uuidv4(),
      ...proposalData,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    proposals.push(proposal);
    return proposal;
  }

  /**
   * Get all proposals (for testing/debugging).
   * @returns {Array}
   */
  getAllProposals() {
    return proposals;
  }

  /**
   * Get proposals by job ID.
   * @param {string} jobId
   * @returns {Array}
   */
  getProposalsByJob(jobId) {
    return proposals.filter((p) => p.jobId === jobId);
  }

  /**
   * Get proposals by freelancer ID.
   * @param {string} freelancerId
   * @returns {Array}
   */
  getProposalsByFreelancer(freelancerId) {
    return proposals.filter((p) => p.freelancerId === freelancerId);
  }

  /**
   * Get a single proposal by ID.
   * @param {string} id
   * @returns {Object|null}
   */
  getProposalById(id) {
    return proposals.find((p) => p.id === id) || null;
  }

  /**
   * Update a proposal.
   * @param {string} id
   * @param {Object} updates
   * @returns {Object|null}
   */
  updateProposal(id, updates) {
    const index = proposals.findIndex((p) => p.id === id);
    if (index === -1) return null;

    proposals[index] = {
      ...proposals[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return proposals[index];
  }

  /**
   * Delete a proposal by ID.
   * @param {string} id
   * @returns {boolean}
   */
  deleteProposal(id) {
    const index = proposals.findIndex((p) => p.id === id);
    if (index === -1) return false;
    proposals.splice(index, 1);
    return true;
  }

  /**
   * Clear all proposals (for testing).
   */
  clear() {
    proposals = [];
  }
}

module.exports = new ProposalService();
