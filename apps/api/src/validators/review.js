import { z } from "zod";

export const reviewSchema = z.object({
  jobId: z.string().min(1),
  revieweeId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5).max(2000)
});
