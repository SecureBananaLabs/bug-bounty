import { z } from "zod";

/**
 * Schema for creating a user via POST /api/users
 * 
 * Security considerations:
 * - `id` is NOT in the schema — it must always be server-generated
 * - `.strict()` rejects unknown fields, preventing id injection
 * - `role` only allows safe public roles (client, freelancer), not admin
 */
export const createUserSchema = z.object({
  email: z.string().email("Valid email is required"),
  name: z.string().min(1, "Name is required").max(100),
  role: z.enum(["client", "freelancer"]).default("client"),
  bio: z.string().max(500).optional()
}).strict();
