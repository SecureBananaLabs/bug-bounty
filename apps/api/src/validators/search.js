import { z } from "zod";

export const searchSchema = z.object({
  query: z.string().min(1, "Search query is required").max(200),
  filters: z.object({
    category: z.string().optional(),
    location: z.string().optional(),
    minPrice: z.number().positive().optional(),
    maxPrice: z.number().positive().optional(),
    skills: z.array(z.string()).optional(),
    rating: z.number().min(0).max(5).optional(),
    availability: z.enum(["available", "busy", "offline"]).optional(),
    sortBy: z.enum(["relevance", "price", "rating", "newest"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional()
  }).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional()
});
