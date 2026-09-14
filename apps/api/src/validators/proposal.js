import { z } from "zod";

export const proposalCreateSchema = z
  .object({
    estimatedDuration: z.string().trim().min(1)
  })
  .passthrough();
