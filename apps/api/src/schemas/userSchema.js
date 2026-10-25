import { z } from "zod";

export const createUserSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email("email must be a valid email address")
      .max(254, "email must not exceed 254 characters")
      .transform((email) => email.toLowerCase()),

    fullName: z
      .string()
      .trim()
      .min(2, "fullName must contain at least 2 characters")
      .max(100, "fullName must not exceed 100 characters"),

    bio: z
      .string()
      .trim()
      .max(500, "bio must not exceed 500 characters")
      .optional(),

    role: z.enum(["client", "freelancer"]).default("client"),

    // Accepted only so legacy/public registration clients do not persist
    // cleartext credentials. It is explicitly removed by the controller.
    password: z.string().max(4096, "password must not exceed 4096 characters").optional()
  })
  .strict("Unknown properties are not allowed");
