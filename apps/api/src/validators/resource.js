import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(["client", "freelancer"]).default("client")
});

export const createMessageSchema = z.object({
  to: z.string().min(1),
  body: z.string().min(1).max(5000)
});

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(3).max(3).default("usd"),
  recipientId: z.string().min(1)
});

export const createReviewSchema = z.object({
  targetId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional()
});

export const createProposalSchema = z.object({
  jobId: z.string().min(1),
  coverLetter: z.string().min(1).max(5000),
  price: z.number().positive()
});

export const createNotificationSchema = z.object({
  userId: z.string().min(1),
  type: z.string().min(1).max(50),
  message: z.string().min(1).max(500)
});
