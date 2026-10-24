import { z } from "zod";

const requiredIdentifier = z
  .string({
    required_error: "is required",
    invalid_type_error: "must be a string",
  })
  .trim()
  .min(1, "must not be empty");

export const createMessageSchema = z
  .object({
    senderId: requiredIdentifier,
    receiverId: requiredIdentifier,
    content: z
      .string({
        required_error: "is required",
        invalid_type_error: "must be a string",
      })
      .min(1, "must not be empty")
      .max(5000, "must not exceed 5000 characters")
      .refine((value) => value.trim().length > 0, {
        message: "must not be blank",
      }),
    conversationId: z
      .string({
        invalid_type_error: "must be a string",
      })
      .trim()
      .min(1, "must not be empty")
      .optional(),
  })
  .strict();

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
