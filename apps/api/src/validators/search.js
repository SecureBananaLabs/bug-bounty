import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, "Search query must not be empty").max(200, "Search query must not exceed 200 characters"),
  type: z.enum(["all", "jobs", "users", "freelancers"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});
