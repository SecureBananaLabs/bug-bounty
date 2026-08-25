import { z } from "zod";

export const searchQuerySchema = z.string().trim().max(200, "Query must be at most 200 characters");
