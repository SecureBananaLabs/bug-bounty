// Fix #1468: User creation validation schema
import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  role: z.enum(["client", "freelancer"]).default("client"), // Fix #1466: no admin self-assignment
  // Add additional fields as needed — this prevents mass assignment attacks
  // by only accepting explicitly defined fields
}).strict(); // Reject any extra fields not in the schema
