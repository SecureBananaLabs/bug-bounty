import { z } from "zod";
import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(["client", "freelancer", "admin"]).default("client")
});

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const payload = createUserSchema.parse(req.body);
  return ok(res, await createUser(payload), 201);
}
