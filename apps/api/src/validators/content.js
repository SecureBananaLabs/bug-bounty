import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);

export const createProposalSchema = z.object({
  coverLetter: nonEmptyString,
  bidAmount: z.number().positive(),
  estDuration: nonEmptyString,
  jobId: nonEmptyString,
  freelancerId: nonEmptyString
});

export const createMessageSchema = z.object({
  body: nonEmptyString,
  senderId: nonEmptyString,
  receiverId: nonEmptyString
});

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: nonEmptyString,
  reviewerId: nonEmptyString,
  revieweeId: nonEmptyString
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["client", "freelancer", "admin"]).default("client"),
  fullName: nonEmptyString
});

export const createNotificationSchema = z.object({
  userId: nonEmptyString,
  title: nonEmptyString,
  body: nonEmptyString
});

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: nonEmptyString.optional(),
  jobId: nonEmptyString.optional()
});
