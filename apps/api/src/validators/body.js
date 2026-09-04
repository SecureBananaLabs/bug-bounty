import { z } from "zod";

const id = z.string().min(1);

export const createMessageSchema = z.object({
  body: z.string().min(1),
  senderId: id,
  receiverId: id
}).strict();

export const createNotificationSchema = z.object({
  userId: id,
  title: z.string().min(1),
  body: z.string().min(1)
}).strict();

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(3).max(3).default("usd"),
  jobId: id
}).strict();

export const createProposalSchema = z.object({
  jobId: id,
  coverLetter: z.string().min(1),
  estimatedDuration: z.string().min(1),
  rate: z.number().positive()
}).strict();

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1),
  reviewerId: id,
  revieweeId: id
}).strict();

export const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  passwordHash: z.string().min(1),
  role: z.enum(["client", "freelancer", "admin"]).default("client"),
  bio: z.string().optional()
}).strict();
