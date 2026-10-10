import { z } from "zod";

export const registerUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["CLIENT", "FREELANCER", "ADMIN"]),
  fullName: z.string().min(1),
});

export function validateRegisterUser(data) {
  return registerUserSchema.parse(data);
}