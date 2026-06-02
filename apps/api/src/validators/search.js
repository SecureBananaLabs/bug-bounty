import { z } from "zod";

export const searchQuerySchema = z.string().trim().min(1).max(100);
