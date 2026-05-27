import { ok } from "../utils/response.js";
import { z } from "zod";
import { createUser, listUsers } from "../services/userService.js";

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(["client", "freelancer", "admin"]).default("client")
});

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

export async function postUser(req, res) {
  const payload = userSchema.parse(req.body);
  return ok(res, await createUser(payload), 201);
}
