import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { createUserSchema } from "../validators/user.js";
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
      return res.status(400).json({ success: false, message: "Validation error", errors: err.errors });
    }
    throw err;
  }
}
