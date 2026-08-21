const proposalService = require('../services/proposalService');
const { createProposalSchema } = require('../validators/proposal');

const postProposal = async (req, res, next) => {
  try {
    const parsed = createProposalSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues,
      });
    }

    const proposal = await proposalService.createProposal(parsed.data);
    return res.status(201).json(proposal);
  } catch (err) {
    return next(err);
  }
};

module.exports = { postProposal };
