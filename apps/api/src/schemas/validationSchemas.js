import { z } from "zod";

export const MessageSchema = z.object({
  recipientId: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export const NotificationSchema = z.object({
  userId: z.string().uuid(),
  message: z.string().min(1).max(1000),
  type: z.enum(["INFO", "ALERT", "SUCCESS"]),
});

export const ProposalSchema = z.object({
  jobId: z.string().uuid(),
  bidAmount: z.number().positive(),
  estimatedDuration: z.number().positive(), // Fix for PR #6400
  coverLetter: z.string().min(10).max(10000),
});

export const ReviewSchema = z.object({
  jobId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(2000),
});

export const JobSchema = z.object({
  title: z.string().min(5).max(200),
  budget: z.object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
  }).refine(data => data.max >= data.min, {
    message: "Max budget must be greater than or equal to min budget", // Fix for PR #6369
  }),
  category: z.string().min(1),
  skills: z.array(z.string()).nonempty(),
});
