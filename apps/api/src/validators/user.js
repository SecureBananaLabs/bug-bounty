import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("valid email is required"),
  name: z.string().min(1, "name is required"),
  role: z.enum(["client", "freelancer"], {
    errorMap: () => ({ message: "role must be client or freelancer" })
  })
});
