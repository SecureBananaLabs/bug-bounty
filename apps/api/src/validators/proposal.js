import { z } from "zod";

export const createProposalSchema = z.object({
  bidAmount: z.number().positive()
}).passthrough();
