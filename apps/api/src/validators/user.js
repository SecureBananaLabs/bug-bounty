import { z } from "zod";

const FORBIDDEN_ROLES = ["admin"];

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  role: z.enum(["client", "freelancer"]).default("client")
}).transform(({ role, ...rest }) => {
  // Extra guard: if somehow "admin" gets past the enum, force to "client"
  const safeRole = FORBIDDEN_ROLES.includes(role) ? "client" : role;
  return { ...rest, role: safeRole };
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  // Role change is intentionally NOT allowed via user update.
  // Role escalation (especially to admin) must go through admin endpoints only.
}).strict();
