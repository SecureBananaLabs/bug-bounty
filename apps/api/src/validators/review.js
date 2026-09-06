import { z } from "zod";

export const createReviewSchema = z.object({
  revieweeId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(2000)
});

export const sendMessageSchema = z.object({
  receiverId: z.string().min(1),
  body: z.string().min(1).max(10000)
});
