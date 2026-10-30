import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  email: z.string().trim().email("Invalid email format").max(255, "Email cannot exceed 255 characters"),
  role: z.enum(["client", "freelancer"]).default("freelancer")
});
