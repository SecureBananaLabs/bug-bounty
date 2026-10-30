import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z
    .string()
    .max(200, "q must be 200 characters or fewer")
    .transform((value) => value.trim())
    .default("")
});
