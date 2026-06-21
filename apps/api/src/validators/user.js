import { z } from "zod";

export const SYSTEM_FIELDS = new Set([
  "id", "createdAt", "updatedAt", "verified",
  "role", "loginCount", "lastLogin",
]);

export const userSchema = new z.ZodObject({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  displayName: z.string().max(100),
  password: z.string().min(8),
});

/** Remove system-controlled fields from user input. */
export function filterSystemFields(obj) {
  const filtered = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!SYSTEM_FIELDS.has(k)) filtered[k] = v;
  }
  return filtered;
}
