import { z } from "zod";

const idSchema = z.string().min(1);

export const createMessageSchema = z.object({
  senderId: idSchema,
  recipientId: idSchema,
  body: z.string().min(1)
});

export const createNotificationSchema = z.object({
  userId: idSchema,
  type: z.string().min(1),
  message: z.string().min(1)
});

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(3).max(3).default("usd")
});

export const createProposalSchema = z.object({
  jobId: idSchema,
  freelancerId: idSchema,
  coverLetter: z.string().min(10),
  bidAmount: z.number().nonnegative()
});

export const createReviewSchema = z.object({
  reviewerId: idSchema,
  revieweeId: idSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).optional()
});

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["client", "freelancer", "admin"]).default("client")
});
