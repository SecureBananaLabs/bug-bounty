import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(["client", "freelancer", "admin"]).default("client")
});

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const payload = createUserSchema.parse(req.body);
  return ok(res, await createUser(payload), 201);
}
