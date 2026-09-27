import { z } from "zod";

export const createUserSchema = z
  .object({
    email: z.string().email(),
    fullName: z.string().min(1).max(200),
    password: z.string().min(8).max(200).optional(),
    bio: z.string().max(2000).optional()
  })
  // Reject unknown keys so a caller cannot smuggle in `role`, `passwordHash`,
  // `id` or any other field the model owns.
  .strict();

export const updateUserSchema = createUserSchema.partial();

/**
 * Admin-driven creation. Unlike `createUserSchema` this may set a role, but it
 * is still strict: anything outside the model is rejected.
 */
export const adminCreateUserSchema = createUserSchema.extend({
  role: z.enum(["client", "freelancer", "admin"]).optional()
}).strict();
