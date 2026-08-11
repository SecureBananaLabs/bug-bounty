const proposalService = require('../services/proposalService');

// Validation schema for proposal creation
const validateCreateProposal = (body) => {
  const errors = [];

  if (!body.jobId || typeof body.jobId !== 'string' || body.jobId.trim() === '') {
    errors.push('jobId is required and must be a non-empty string');
  }

  if (!body.freelancerId || typeof body.freelancerId !== 'string' || body.freelancerId.trim() === '') {
    errors.push('freelancerId is required and must be a non-empty string');
  }

  if (!body.coverLetter || typeof body.coverLetter !== 'string' || body.coverLetter.trim() === '') {
    errors.push('coverLetter is required and must be a non-empty string');
  }

  if (body.bidAmount === undefined || body.bidAmount === null || typeof body.bidAmount !== 'number' || body.bidAmount <= 0) {
    errors.push('bidAmount is required and must be a positive number');
  }

  if (!body.estDuration || typeof body.estDuration !== 'string' || body.estDuration.trim() === '') {
    errors.push('estDuration is required and must be a non-empty string');
  }

  return errors;
};

const createProposal = async (req, res, next) => {
  try {
    const errors = validateCreateProposal(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const proposal = await proposalService.createProposal(req.body);
    res.status(201).json(proposal);
  } catch (error) {
    next(error);
  }
};

const getProposal = async (req, res, next) => {
  try {
    const proposal = await proposalService.getProposal(req.params.id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    res.json(proposal);
  } catch (error) {
    next(error);
  }
};

const updateProposal = async (req, res, next) => {
  try {
    const proposal = await proposalService.updateProposal(req.params.id, req.body);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    res.json(proposal);
  } catch (error) {
    next(error);
  }
};

const deleteProposal = async (req, res, next) => {
  try {
    const proposal = await proposalService.deleteProposal(req.params.id);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    res.json({ message: 'Proposal deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const listProposals = async (req, res, next) => {
  try {
    const proposals = await proposalService.listProposals(req.query);
    res.json(proposals);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProposal,
  getProposal,
  updateProposal,
  deleteProposal,
  listProposals,
};
