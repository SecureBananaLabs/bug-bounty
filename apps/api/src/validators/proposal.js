const { z } = require('zod');

const createProposalSchema = z.object({
  jobId: z.string(),
  rate: z.number().positive(),
  message: z.string(),
});

module.exports = { createProposalSchema };
