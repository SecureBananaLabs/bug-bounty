import { z } from "zod";
import { ALL_ROLES, PUBLIC_ROLES, ROLES } from "../constants/roles.js";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(PUBLIC_ROLES).default(ROLES.CLIENT)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(ALL_ROLES).default(ROLES.CLIENT)
});
