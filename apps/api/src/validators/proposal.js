import { z } from "zod";

export const createProposalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  estimatedDuration: z.string().min(1, "estimatedDuration is required"),
  budget: z.number().positive().optional(),
  clientId: z.string().min(1),
});
