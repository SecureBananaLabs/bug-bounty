import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  name: z.string().trim().min(1, "Name is required"),
  role: z.enum(["client", "freelancer"]).optional().default("client")
});
