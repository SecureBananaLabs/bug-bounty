import { ZodError } from "zod";
import { fail, ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { createUserSchema } from "../validators/user.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  try {
    const payload = createUserSchema.parse(req.body ?? {});
    return ok(res, await createUser(payload), 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return fail(res, "Validation failed", 400);
    }
    throw error;
  }
}
