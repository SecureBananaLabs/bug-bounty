import { z } from "zod";

/**
 * Schema for validating search query parameters.
 * - Must be a string (coerced from query params)
 * - Must not be empty after trimming
 * - Max length of 200 characters to prevent abuse
 */
export const searchSchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, "Search query is required")
    .max(200, "Search query must be at most 200 characters")
});

/**
 * Schema for the raw query parameter (before object wrapping).
 * Validates that `q` is a string and applies length limits.
 */
export const searchQuerySchema = z
  .string()
  .trim()
  .min(1, "Search query is required")
  .max(200, "Search query must be at most 200 characters");