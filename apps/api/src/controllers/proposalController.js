const proposalService = require('../services/proposalService');

/**
 * POST /api/proposals
 * Create a new proposal.
 */
function createProposal(req, res, next) {
  try {
    const proposal = proposalService.createProposal(req.body);
    res.status(201).json({ success: true, data: proposal });
  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
}

/**
 * GET /api/proposals/job/:jobId
 * Get all proposals for a job.
 */
function getProposalsByJob(req, res, next) {
  try {
    const proposals = proposalService.getProposalsByJob(req.params.jobId);
    res.json({ success: true, data: proposals });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/proposals/freelancer/:freelancerId
 * Get all proposals by a freelancer.
 */
function getProposalsByFreelancer(req, res, next) {
  try {
    const proposals = proposalService.getProposalsByFreelancer(req.params.freelancerId);
    res.json({ success: true, data: proposals });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/proposals/:id
 * Get a single proposal by ID.
 */
function getProposalById(req, res, next) {
  try {
    const proposal = proposalService.getProposalById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }
    res.json({ success: true, data: proposal });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/proposals/:id
 * Update a proposal.
 */
function updateProposal(req, res, next) {
  try {
    const proposal = proposalService.updateProposal(req.params.id, req.body);
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }
    res.json({ success: true, data: proposal });
  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
}

/**
 * DELETE /api/proposals/:id
 * Delete a proposal.
 */
function deleteProposal(req, res, next) {
  try {
    const deleted = proposalService.deleteProposal(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }
    res.json({ success: true, message: 'Proposal deleted' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createProposal,
  getProposalsByJob,
  getProposalsByFreelancer,
  getProposalById,
  updateProposal,
  deleteProposal,
};
