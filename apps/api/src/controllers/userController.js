import { fail, ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { createUserSchema } from "../validators/user.js";
import { authMiddleware } from "../middleware/auth.js";
import { ZodError } from "zod";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const payload = createUserSchema.parse(req.body);
  return ok(res, await createUser(payload), 201);
}
