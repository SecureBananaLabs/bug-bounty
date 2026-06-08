import { fail, ok } from "../utils/response.js";
import { createUserSchema } from "../validators/body.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, "Invalid request body", 400, { issues: parsed.error.issues });
  }

  return ok(res, await createUser(parsed.data), 201);
}
