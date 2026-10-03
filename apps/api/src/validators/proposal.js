import { z } from 'zod';

export const createProposalSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  coverLetter: z.string().min(10, 'Cover letter must be at least 10 characters'),
  bidAmount: z.number().positive('Bid amount must be a positive number').finite('Bid amount must be a finite number'),
});

export const updateProposalSchema = z.object({
  coverLetter: z.string().min(10, 'Cover letter must be at least 10 characters').optional(),
  bidAmount: z.number().positive('Bid amount must be a positive number').finite('Bid amount must be a finite number').optional(),
});

export const proposalIdSchema = z.object({
  id: z.string().min(1, 'Proposal ID is required'),
});