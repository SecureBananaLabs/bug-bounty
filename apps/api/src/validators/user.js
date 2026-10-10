import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Valid email is required"),
  role: z.enum(["client", "freelancer"]).default("client"),
}).strict();
