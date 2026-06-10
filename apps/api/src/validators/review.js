import { z } from "zod";

export const createReviewSchema = z.object({
  jobId: z.string().min(1, "jobId is required"),
  userId: z.string().min(1, "userId is required"),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1, "comment is required").max(1000),
});
