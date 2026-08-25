const proposalService = require('../services/proposalService');
const { validateCreateProposal } = require('../validators/proposal');
const { Response } = require('../utils/response');

const postProposal = async (req, res) => {
  try {
    const validation = validateCreateProposal(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        errors: validation.error.errors.map(err => ({ field: err.path[0], message: err.message }))
      });
    }

    const proposal = await proposalService.createProposal(req.body);
    return Response.success(res, proposal, "Proposal created successfully");
  } catch (error) {
    console.error('Error in postProposal:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  postProposal
};