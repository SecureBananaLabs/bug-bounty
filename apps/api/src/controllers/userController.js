import { fail, ok } from "../utils/response.js";
import { createUserSchema } from "../validators/auth.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    const [first] = parsed.error.issues;
    return fail(res, `${first.path.join(".")} must be valid`, 400);
  }

  return ok(res, await createUser(parsed.data), 201);
}
