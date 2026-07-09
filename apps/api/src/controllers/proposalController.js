const proposalService = require('../services/proposalService');

class ProposalController {
  /**
   * POST /api/proposals
   */
  createProposal(req, res, next) {
    try {
      const proposal = proposalService.createProposal(req.body);
      res.status(201).json(proposal);
    } catch (error) {
      if (error.statusCode === 409) {
        return res.status(409).json({ error: error.message });
      }
      next(error);
    }
  }

  /**
   * GET /api/proposals
   */
  getAllProposals(req, res, next) {
    try {
      const proposals = proposalService.getAllProposals();
      res.json(proposals);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/proposals/job/:jobId
   */
  getProposalsByJob(req, res, next) {
    try {
      const proposals = proposalService.getProposalsByJob(req.params.jobId);
      res.json(proposals);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/proposals/freelancer/:freelancerId
   */
  getProposalsByFreelancer(req, res, next) {
    try {
      const proposals = proposalService.getProposalsByFreelancer(req.params.freelancerId);
      res.json(proposals);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/proposals/:id
   */
  getProposalById(req, res, next) {
    try {
      const proposal = proposalService.getProposalById(req.params.id);
      if (!proposal) {
        return res.status(404).json({ error: 'Proposal not found' });
      }
      res.json(proposal);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/proposals/:id
   */
  updateProposal(req, res, next) {
    try {
      const proposal = proposalService.updateProposal(req.params.id, req.body);
      if (!proposal) {
        return res.status(404).json({ error: 'Proposal not found' });
      }
      res.json(proposal);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/proposals/:id
   */
  deleteProposal(req, res, next) {
    try {
      const deleted = proposalService.deleteProposal(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Proposal not found' });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProposalController();
