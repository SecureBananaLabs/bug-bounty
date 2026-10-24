import { z } from "zod";

export const createProposalSchema = z
  .object({
    jobId: z
      .string({
        required_error: "jobId is required",
        invalid_type_error: "jobId must be a string",
      })
      .min(1, "jobId must contain at least 1 character")
      .max(128, "jobId must not exceed 128 characters"),

    coverLetter: z
      .string({
        required_error: "coverLetter is required",
        invalid_type_error: "coverLetter must be a string",
      })
      .min(10, "coverLetter must contain at least 10 characters")
      .max(5000, "coverLetter must not exceed 5000 characters"),

    bidAmount: z
      .number({
        required_error: "bidAmount is required",
        invalid_type_error: "bidAmount must be a number",
      })
      .finite("bidAmount must be a finite number")
      .positive("bidAmount must be greater than 0"),

    estimatedDuration: z
      .string({
        invalid_type_error: "estimatedDuration must be a string",
      })
      .max(100, "estimatedDuration must not exceed 100 characters")
      .optional(),

    freelancerId: z
      .string({
        invalid_type_error: "freelancerId must be a string",
      })
      .max(128, "freelancerId must not exceed 128 characters")
      .optional(),
  })
  .strict();
