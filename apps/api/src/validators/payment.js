import { z } from "zod";

export const SYSTEM_FIELDS = new Set([
  "id", "paymentId", "createdAt", "updatedAt",
  "provider", "status", "userId",
]);

export const paymentSchema = new z.ZodObject({
  amount: z.number().positive().max(1000000),
  currency: z.string().regex(/^[a-z]{3}$/),
  description: z.string().max(500).optional(),
});

/** Remove system-controlled fields from user input. */
export function filterSystemFields(obj) {
  const filtered = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!SYSTEM_FIELDS.has(k)) filtered[k] = v;
  }
  return filtered;
}
