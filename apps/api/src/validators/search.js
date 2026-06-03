import { z } from "zod";

export const searchQuerySchema = z
  .string()
  .trim()
  .max(200)
  .default("");
