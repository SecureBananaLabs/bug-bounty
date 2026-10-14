import { z } from "zod";

export const createProposalSchema = z.object({
  estimatedDuration: z.union([z.string(), z.number()]).optional(),
  estDuration: z.union([z.string(), z.number()]).optional(),
}).refine(data => data.estimatedDuration !== undefined || data.estDuration !== undefined, {
  message: "Estimated duration is required",
  path: ["estimatedDuration"]
});
