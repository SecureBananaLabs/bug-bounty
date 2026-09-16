import { z } from "zod";

export const createPaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().min(3).max(3).default("usd"),
  jobId: z.string().optional(),
  description: z.string().max(500).optional()
});

export const createReviewSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  freelancerId: z.string().min(1, "Freelancer ID is required"),
  clientId: z.string().min(1, "Client ID is required")
});

export const sendMessageSchema = z.object({
  receiverId: z.string().min(1, "Receiver ID is required"),
  content: z.string().min(1, "Message content is required").max(5000),
  jobId: z.string().optional()
});
