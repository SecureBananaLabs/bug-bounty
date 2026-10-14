import { z } from "zod";

export const searchQuerySchema = z
  .string()
  .trim()
  .max(200, "Search query must be at most 200 characters")
  .optional()
  .default("");
