import { fail, ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { createUserSchema } from "../validators/user.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const parsedPayload = createUserSchema.safeParse(req.body);

  if (!parsedPayload.success) {
    return fail(res, "Invalid user payload");
  }

  return ok(res, await createUser(parsedPayload.data), 201);
}
