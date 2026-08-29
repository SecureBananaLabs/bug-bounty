import { z } from "zod";

export const searchSchema = z.object({
  q: z.string().trim().max(200).default("")
});
