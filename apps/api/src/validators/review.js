import { z } from "zod";

// Keep this validator deliberately scoped to the job-association invariant.
// Existing review fields continue to flow through unchanged.
export const createReviewJobSchema = z.object({
  jobId: z.string().min(1)
}).passthrough();
