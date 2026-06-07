import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  content: z.string().min(10),
  jobId: z.string().min(1)
});

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['USD','EUR','GBP','USDT']),
  method: z.enum(['card','paypal','crypto','usdt'])
});

export const createProposalSchema = z.object({
  jobId: z.string().min(1),
  coverLetter: z.string().min(10),
  proposedRate: z.number().nonnegative()
});

export const createMessageSchema = z.object({
  recipientId: z.string().min(1),
  content: z.string().min(1).max(5000)
});

export const createNotificationSchema = z.object({
  type: z.enum(['info','warning','success','error']),
  recipientId: z.string().min(1),
  title: z.string().min(1).max(200),
  body: z.string().min(1)
});
