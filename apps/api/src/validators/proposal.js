<content>
import { z } from 'zod';

export const createProposalSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(10).max(2000),
  budget: z.number().min(0),
  deadline: z.date(),
  clientId: z.string(),
  freelancerId: z.string(),
  status: z.enum(['pending', 'approved', 'rejected', 'in-progress', 'completed']).default('pending'),
});

export const updateProposalSchema = createProposalSchema.partial().extend({
  id: z.string(),
});

export const createProposalSchemaType = z.infer<typeof createProposalSchema>;
export const updateProposalSchemaType = z.infer<typeof updateProposalSchema>;