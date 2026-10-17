import { z } from "zod";

const metadataValueSchema = z.union([z.string(), z.number(), z.boolean()]);

export const createPaymentSchema = z
  .object({
    amount: z
      .number({
        required_error: "Payment amount is required",
        invalid_type_error: "Payment amount must be a number"
      })
      .int("Payment amount must be a positive integer in the smallest currency unit")
      .positive("Payment amount must be a positive integer in the smallest currency unit"),
    currency: z
      .string({ invalid_type_error: "Payment currency must be a string" })
      .trim()
      .regex(/^[a-z]{3}$/i, "Payment currency must be a three-letter ISO currency code")
      .optional(),
    metadata: z.record(metadataValueSchema, {
      invalid_type_error: "Payment metadata must be a flat object when provided"
    }).optional(),
    idempotencyKey: z
      .string({ invalid_type_error: "Payment idempotencyKey must be a string when provided" })
      .trim()
      .min(1, "Payment idempotencyKey must be between 1 and 255 characters")
      .max(255, "Payment idempotencyKey must be between 1 and 255 characters")
      .optional()
  })
  .strict();
