import { z } from "zod";

export const createNotificationSchema = z.object({
  type: z.enum(["info", "warning", "success"]).default("info"),
  message: z.string().min(1).max(500),
  recipientId: z.string().min(1)
});

export const createProposalSchema = z.object({
  jobId: z.string().min(1),
  coverLetter: z.string().min(10).max(5000),
  bidAmount: z.number().positive().max(999999),
  deliveryDays: z.number().int().positive().max(365).default(7)
});

export const createReviewSchema = z.object({
  targetUserId: z.string().min(1),
  jobId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).default("")
});
