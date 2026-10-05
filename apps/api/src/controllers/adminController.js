import { ok } from "../utils/response.js";
import { getAdminMetrics } from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}

export async function postUser(req, res) {
  const { createUserSchema } = await import("../validators/auth.js");
  const result = createUserSchema.safeParse(req.body);
  
  if (!result.success) {
    const error = new Error("Validation failed");
    error.name = "ZodError";
    error.errors = result.error.errors;
    throw error;
  }

  const { createUser } = await import("../services/userService.js");
  const user = await createUser(result.data);
  
  return ok(res, user);
}
