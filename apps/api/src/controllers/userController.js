import { z } from "zod";
import { ok } from "../utils/response.js";
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

const schema = z.object({ email: z.string().email(), role: z.enum(["admin", "client", "freelancer"]).default("client") }).strict();

export async function postUser(req, res) {
  let payload;
  try {
    payload = schema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ success: false, message: "Validation failed" });
  }
  return ok(res, await createUser(payload), 201);
}
