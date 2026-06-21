import { z } from "zod";

export const createProposalSchema = new z.ZodObject({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  estimatedDuration: z.number().positive(),
  budget: z.number().positive(),
  tags: z.array(z.string()).optional(),
});
