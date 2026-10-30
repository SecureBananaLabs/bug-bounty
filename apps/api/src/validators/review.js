import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().int().min(1, "Min 1 star").max(5, "Max 5 stars"),
  comment: z.string().min(5, "Comment too short").max(2000, "Comment too long"),
  jobId: z.string().min(1, "Job ID required"),
  freelancerId: z.string().min(1, "Freelancer ID required")
});
