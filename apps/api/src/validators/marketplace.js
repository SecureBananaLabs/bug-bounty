import { z } from "zod";

const id = z.string().min(1);

export const createProposalSchema = z.object({
  coverLetter: z.string().min(10),
  bidAmount: z.number().positive(),
  estDuration: z.string().min(1),
  jobId: id,
  freelancerId: id
});

export const createMessageSchema = z.object({
  body: z.string().trim().min(1),
  senderId: id,
  receiverId: id
}).refine((data) => data.senderId !== data.receiverId, {
  message: "receiverId must be different from senderId",
  path: ["receiverId"]
});

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().trim().min(3).max(3).default("usd"),
  jobId: id
});

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1),
  reviewerId: id,
  revieweeId: id
}).refine((data) => data.reviewerId !== data.revieweeId, {
  message: "revieweeId must be different from reviewerId",
  path: ["revieweeId"]
});
