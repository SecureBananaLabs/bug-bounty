import { z } from "zod";

export const searchSchema = z.object({
  q: z
    .string({
      invalid_type_error: "Search query must be a string"
    })
    .trim()
    .max(200, "Search query must not exceed 200 characters")
    .optional()
    .default("")
});

export const searchQuerySchema = searchSchema;
