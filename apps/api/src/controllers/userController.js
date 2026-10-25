import { fail, ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { createUserSchema } from "../schemas/userSchema.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const parsed = createUserSchema.safeParse(req.body);

  if (!parsed.success) {
    return fail(res, "Invalid user creation payload", 400);
  }

  const { password, ...userInput } = parsed.data;
  const user = await createUser(userInput);

  return ok(res, user, 201);
}
