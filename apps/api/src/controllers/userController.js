import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { createUserSchema } from "../validators/user.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const parsed = createUserSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid user payload",
      errors: parsed.error.issues.map(({ path, message }) => ({
        field: path.join("."),
        message
      }))
    });
  }

  return ok(res, await createUser(parsed.data), 201);
}
