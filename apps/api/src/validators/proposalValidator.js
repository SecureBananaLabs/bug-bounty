import { z } from 'zod';

export const createProposalSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  freelancerId: z.string().min(1, 'Freelancer ID is required'),
  coverLetter: z.string().optional(),
  estimatedDuration: z.string().min(1, 'Estimated duration is required'),
  proposedRate: z.number().positive('Proposed rate must be positive').optional(),
});
