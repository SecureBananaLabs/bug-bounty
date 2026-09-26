import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.preprocess(
    (value) => (value === undefined ? "" : value),
    z.string().trim().max(200)
  )
});
