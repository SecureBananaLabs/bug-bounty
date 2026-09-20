import { ok, fail } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { createUserSchema } from "../validators/auth.js";
import { ZodError } from "zod";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  try {
    const payload = createUserSchema.parse(req.body);
    return ok(res, await createUser(payload), 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return fail(res, err.errors.map(e => e.message).join("; "), 400);
    }
    throw err;
  }
}
