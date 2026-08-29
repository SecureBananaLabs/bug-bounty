import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { createUserSchema } from "../validators/user.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      issues: result.error.issues
    });
  }

  return ok(res, await createUser(result.data), 201);
}
