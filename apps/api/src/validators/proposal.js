const { z } = require('zod');

const createProposalSchema = z.object({
  jobId: z.string().min(1, "jobId is required"),
  freelancerId: z.string().min(1, "freelancerId is required"),
  bidAmount: z.number().gt(0, "bidAmount must be a positive number greater than zero"),
  coverLetter: z.string().min(10, "cover letter must be at least 10 characters long"),
  estimatedDuration: z.string().min(1, "estimatedDuration is required"),
});

const validateCreateProposal = (data) => {
  return createProposalSchema.safeParse(data);
};

module.exports = {
  validateCreateProposal
};