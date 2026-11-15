import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { createUserSchema } from "../validators/user.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const parsed = createUserSchema.safeParse(req.body);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message
    }));

    return res.status(400).json({
      success: false,
      message: "Invalid user payload",
      errors
    });
  }

  return ok(res, await createUser(parsed.data), 201);
}
